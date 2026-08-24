package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.returnRequest.CreateReturnRequest;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestDto;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestMapper;
import com.ecommerce.commerce_service.dto.inventory.DeductStockRequest;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.ReturnRequest;
import com.ecommerce.commerce_service.model.ReturnStatus;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.ReturnRequestRepository;
import com.ecommerce.commerce_service.client.CommerceInventoryService;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnRequestService {
    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnRequestMapper returnRequestMapper;
    private final OrderRepository orderRepository;
    private final CommerceInventoryService commerceInventoryService;
    private final PaymentService paymentService;

    @Transactional
    public ReturnRequestDto createReturnRequest(CreateReturnRequest request, UUID authenticatedCustomerId) {
        Order order = orderRepository.findLockedById(request.getOrderId());
        if (order == null) throw new IllegalArgumentException("Order not found");
        if (order.getCustomerId() == null || !order.getCustomerId().equals(authenticatedCustomerId)) {
            throw new SecurityException("Return does not belong to this customer");
        }

        String requestedVariant = request.getVariantId();
        var orderedItem = order.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .filter(item -> Objects.equals(
                        item.getVariantId() == null ? null : item.getVariantId().toString(), requestedVariant))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Product or variant is not part of this order"));

        int alreadyRequested = returnRequestRepository.findByOrderId(order.getId()).stream()
                .filter(existing -> existing.getStatus() != ReturnStatus.REJECTED)
                .filter(existing -> existing.getProductId().equals(request.getProductId()))
                .filter(existing -> Objects.equals(existing.getVariantId(), requestedVariant))
                .mapToInt(ReturnRequest::getQuantity)
                .sum();
        if (request.getQuantity() > orderedItem.getQuantity() - alreadyRequested) {
            throw new IllegalArgumentException("Return quantity exceeds the remaining eligible quantity");
        }

        ReturnRequest returnRequest = returnRequestMapper.returnRequestDtoToReturnRequest(request);
        returnRequest.setCustomerId(authenticatedCustomerId);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    public List<ReturnRequestDto> getReturnRequestsByOrder(UUID orderId) {
        return returnRequestRepository.findByOrderId(orderId)
                .stream()
                .map(returnRequestMapper::returnRequestToReturnRequestDto)
                .collect(Collectors.toList());
    }

    public List<ReturnRequestDto> getReturnRequestsByCustomer(UUID customerId) {
        return returnRequestRepository.findByCustomerId(customerId)
                .stream()
                .map(returnRequestMapper::returnRequestToReturnRequestDto)
                .collect(Collectors.toList());
    }

    /** Admin queue: all return requests, newest first (REQUESTED first, then by date). */
    public List<ReturnRequestDto> getAllReturnRequests() {
        return returnRequestRepository.findAll().stream()
                .sorted((a, b) -> {
                    int rank = statusRank(a.getStatus()) - statusRank(b.getStatus());
                    if (rank != 0) return rank;
                    return b.getCreatedDate() != null ? b.getCreatedDate().compareTo(a.getCreatedDate()) : 0;
                })
                .map(returnRequestMapper::returnRequestToReturnRequestDto)
                .collect(Collectors.toList());
    }

    private int statusRank(ReturnStatus status) {
        if (status == ReturnStatus.REQUESTED) return 0;
        if (status == ReturnStatus.APPROVED) return 1;
        return 2;
    }

    @Transactional
    public ReturnRequestDto approveReturnRequest(UUID returnRequestId) {
        ReturnRequest returnRequest = lockedReturn(returnRequestId);
        if (returnRequest.getStatus() != ReturnStatus.REQUESTED) {
            throw new IllegalArgumentException("Only requested returns can be approved");
        }
        UUID variantUuid = returnRequest.getVariantId() != null ? UUID.fromString(returnRequest.getVariantId()) : null;
        commerceInventoryService.restoreStock(List.of(
                new DeductStockRequest(returnRequest.getProductId(), returnRequest.getQuantity(), variantUuid)
        ));
        returnRequest.setStatus(ReturnStatus.APPROVED);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    @Transactional
    public ReturnRequestDto rejectReturnRequest(UUID returnRequestId, String reason) {
        ReturnRequest returnRequest = lockedReturn(returnRequestId);
        if (returnRequest.getStatus() != ReturnStatus.REQUESTED) {
            throw new IllegalArgumentException("Only requested returns can be rejected");
        }
        returnRequest.setStatus(ReturnStatus.REJECTED);
        returnRequest.setRejectionReason(reason);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    @Transactional
    public ReturnRequestDto refundReturnRequest(UUID returnRequestId) {
        ReturnRequest returnRequest = lockedReturn(returnRequestId);

        if (returnRequest.getStatus() != ReturnStatus.APPROVED) {
            throw new RuntimeException("Return request must be APPROVED before refunding (current: "
                    + returnRequest.getStatus() + ")");
        }

        Order order = orderRepository.findById(returnRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        BigDecimal unitPrice = order.getItems().stream()
                .filter(item -> item.getProductId().equals(returnRequest.getProductId()))
                .filter(item -> Objects.equals(
                        item.getVariantId() == null ? null : item.getVariantId().toString(),
                        returnRequest.getVariantId()))
                .findFirst()
                .map(item -> item.getPrice() == null ? BigDecimal.ZERO : item.getPrice())
                .orElse(BigDecimal.ZERO);

        BigDecimal refundAmount = unitPrice.multiply(BigDecimal.valueOf(returnRequest.getQuantity()));

        // Charge the provider; on failure the request stays APPROVED and the
        // admin sees the provider message.
        ProviderPaymentResult result = paymentService.refundOrderPayment(order.getId(), refundAmount);
        if (!result.isSuccess()) {
            throw new RuntimeException("Refund failed: " + result.getMessage());
        }

        returnRequest.setStatus(ReturnStatus.REFUNDED);
        returnRequest.setRefundAmount(refundAmount);
        returnRequest.setRefundTransactionId(result.getTransactionId());
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    private ReturnRequest lockedReturn(UUID id) {
        ReturnRequest request = returnRequestRepository.findLockedById(id);
        if (request == null) throw new IllegalArgumentException("Return request not found");
        return request;
    }
}
