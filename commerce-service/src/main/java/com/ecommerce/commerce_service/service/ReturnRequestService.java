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
import java.math.RoundingMode;
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
    private final GiftCardService giftCardService;

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
        commerceInventoryService.restoreStock("return-approved-" + returnRequest.getId(), List.of(
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

        Order order = orderRepository.findLockedById(returnRequest.getOrderId());
        if (order == null) throw new IllegalArgumentException("Order not found");

        var orderedItem = order.getItems().stream()
                .filter(item -> item.getProductId().equals(returnRequest.getProductId()))
                .filter(item -> Objects.equals(
                        item.getVariantId() == null ? null : item.getVariantId().toString(),
                        returnRequest.getVariantId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Returned line is not part of the order"));

        BigDecimal merchandiseSubtotal = order.getItems().stream()
                .map(item -> nvl(item.getPrice()).multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal lineGross = nvl(orderedItem.getPrice())
                .multiply(BigDecimal.valueOf(returnRequest.getQuantity()));
        BigDecimal merchandiseDiscount = nvl(order.getDiscountAmount()).add(nvl(order.getLoyaltyDiscountAmount()));
        BigDecimal lineDiscount = merchandiseSubtotal.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                : merchandiseDiscount.multiply(lineGross).divide(merchandiseSubtotal, 2, RoundingMode.HALF_UP)
                        .min(lineGross);
        BigDecimal refundableNet = lineGross.subtract(lineDiscount).max(BigDecimal.ZERO);

        // Shipping and gift wrap are not refunded for a line return. Tax is
        // returned only in proportion to the discounted merchandise value.
        BigDecimal taxableAmount = merchandiseSubtotal.add(nvl(order.getShippingAmount()))
                .add(nvl(order.getGiftWrapFee())).subtract(merchandiseDiscount).max(BigDecimal.ZERO);
        BigDecimal lineTax = taxableAmount.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                : nvl(order.getTaxAmount()).multiply(refundableNet)
                        .divide(taxableAmount, 2, RoundingMode.HALF_UP);
        BigDecimal refundAmount = refundableNet.add(lineTax).setScale(2, RoundingMode.HALF_UP);
        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Calculated refund amount must be positive");
        }

        // Multi-tender policy: restore gift-card value first, then refund only
        // the remainder to the captured provider payment.
        BigDecimal giftOriginallyApplied = nvl(order.getGiftCardAmount());
        BigDecimal giftAlreadyRefunded = nvl(order.getGiftCardRefundedAmount());
        BigDecimal giftRemaining = giftOriginallyApplied.subtract(giftAlreadyRefunded).max(BigDecimal.ZERO);
        BigDecimal giftRefund = refundAmount.min(giftRemaining);
        BigDecimal providerRefund = refundAmount.subtract(giftRefund);

        if (giftRefund.compareTo(BigDecimal.ZERO) > 0) {
            giftCardService.restoreOrderCredit(order.getGiftCardId(), giftRefund);
        }

        ProviderPaymentResult providerResult = null;
        if (providerRefund.compareTo(BigDecimal.ZERO) > 0) {
            providerResult = paymentService.refundOrderPayment(order.getId(), providerRefund);
            if (!providerResult.isSuccess()) {
                throw new RuntimeException("Refund failed: " + providerResult.getMessage());
            }
        }

        order.setGiftCardRefundedAmount(giftAlreadyRefunded.add(giftRefund));
        order.setProviderRefundedAmount(nvl(order.getProviderRefundedAmount()).add(providerRefund));
        orderRepository.save(order);

        returnRequest.setStatus(ReturnStatus.REFUNDED);
        returnRequest.setRefundAmount(refundAmount);
        returnRequest.setGiftCardRefundAmount(giftRefund);
        returnRequest.setProviderRefundAmount(providerRefund);
        returnRequest.setRefundTransactionId(providerResult == null
                ? "GIFT-CARD-" + (order.getGiftCardCodeLast4() == null ? "CREDIT" : order.getGiftCardCodeLast4())
                : providerResult.getTransactionId());
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private ReturnRequest lockedReturn(UUID id) {
        ReturnRequest request = returnRequestRepository.findLockedById(id);
        if (request == null) throw new IllegalArgumentException("Return request not found");
        return request;
    }
}
