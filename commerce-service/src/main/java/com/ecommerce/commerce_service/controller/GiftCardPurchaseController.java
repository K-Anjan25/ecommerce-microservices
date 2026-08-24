package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.giftCard.CreateGiftCardPurchaseRequest;
import com.ecommerce.commerce_service.dto.giftCard.GiftCardPurchaseAdminDto;
import com.ecommerce.commerce_service.audit.AuditLogService;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.dto.giftCard.GiftCardPurchaseRefundResponse;
import com.ecommerce.commerce_service.dto.giftCard.GiftCardPurchaseResponse;
import com.ecommerce.commerce_service.dto.payment.PaymentResponse;
import com.ecommerce.commerce_service.service.GiftCardPurchaseRefundService;
import com.ecommerce.commerce_service.service.GiftCardPurchaseService;
import com.ecommerce.commerce_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

/** Starts a customer gift-card purchase; stored value is finalized after settlement. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/gift-cards")
public class GiftCardPurchaseController {
    private final GiftCardPurchaseService purchaseService;
    private final PaymentService paymentService;
    private final GiftCardPurchaseRefundService refundService;
    private final AuditLogService auditLogService;

    @PostMapping("/purchase")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<GiftCardPurchaseResponse> purchase(
            @Valid @RequestBody CreateGiftCardPurchaseRequest request) {
        UUID customerId = UUID.fromString(String.valueOf(
                SecurityContextHolder.getContext().getAuthentication().getPrincipal()));
        GiftCardPurchaseService.PurchaseStart start = purchaseService.create(request, customerId);
        PaymentResponse payment = paymentService.processPayment(start.getPaymentRequest(), customerId);
        return new ResponseEntity<>(GiftCardPurchaseResponse.builder()
                .purchaseId(start.getPurchaseId())
                .orderId(start.getOrderId())
                .payment(payment)
                .build(), HttpStatus.CREATED);
    }

    @GetMapping("/purchases")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<GiftCardPurchaseAdminDto>> listPurchases(
            @RequestParam(defaultValue = "ISSUED") GiftCardPurchaseStatus status) {
        return ResponseEntity.ok(purchaseService.findByStatus(status));
    }

    /** Refunds only unused settled value; administrators cannot refund a spent card. */
    @PostMapping("/purchases/{purchaseId}/refund")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<GiftCardPurchaseRefundResponse> refund(@PathVariable UUID purchaseId) {
        GiftCardPurchaseRefundResponse result = refundService.refund(purchaseId);
        auditLogService.record("GIFT_CARD_PURCHASE_REFUNDED", "GIFT_CARD_PURCHASE",
                purchaseId.toString(), result.getRefundedAmount() == null
                        ? null : result.getRefundedAmount().toPlainString());
        return ResponseEntity.ok(result);
    }
}
