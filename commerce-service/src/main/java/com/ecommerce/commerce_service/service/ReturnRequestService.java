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

import java.math.BigDecimal;
import java.util.List;
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

    public ReturnRequestDto createReturnRequest(CreateReturnRequest createReturnRequest) {
        ReturnRequest returnRequest = returnRequestMapper.returnRequestDtoToReturnRequest(createReturnRequest);
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

    public ReturnRequestDto approveReturnRequest(UUID returnRequestId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        returnRequest.setStatus(ReturnStatus.APPROVED);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        try {
            UUID variantUuid = returnRequest.getVariantId() != null ? UUID.fromString(returnRequest.getVariantId()) : null;
            commerceInventoryService.restoreStock(List.of(
                    new DeductStockRequest(returnRequest.getProductId(), returnRequest.getQuantity(), variantUuid)
            ));
        } catch (Exception e) {
            log.error("Failed to restore stock for return request {}", returnRequestId, e);
        }

        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    public ReturnRequestDto rejectReturnRequest(UUID returnRequestId, String reason) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        returnRequest.setStatus(ReturnStatus.REJECTED);
        returnRequest.setRejectionReason(reason);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    public ReturnRequestDto refundReturnRequest(UUID returnRequestId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));

        if (returnRequest.getStatus() != ReturnStatus.APPROVED) {
            throw new RuntimeException("Return request must be APPROVED before refunding (current: "
                    + returnRequest.getStatus() + ")");
        }

        Order order = orderRepository.findById(returnRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        BigDecimal unitPrice = order.getItems().stream()
                .filter(item -> item.getProductId().equals(returnRequest.getProductId()))
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
}
