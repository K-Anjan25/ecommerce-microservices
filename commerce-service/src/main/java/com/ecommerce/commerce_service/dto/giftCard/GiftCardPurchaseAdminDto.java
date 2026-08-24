package com.ecommerce.commerce_service.dto.giftCard;

import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Admin projection for gift-card purchase and refund operations. */
@Getter
@Builder
public class GiftCardPurchaseAdminDto {
    private UUID purchaseId;
    private UUID orderId;
    private UUID customerId;
    private BigDecimal amount;
    private LocalDate expiryDate;
    private String recipientEmail;
    private GiftCardPurchaseStatus status;
    private UUID giftCardId;
    private BigDecimal refundedAmount;
    private String refundTransactionId;
    private LocalDateTime createdAt;
    private LocalDateTime issuedAt;
    private LocalDateTime refundedAt;

    public static GiftCardPurchaseAdminDto from(GiftCardPurchaseIntent intent) {
        return GiftCardPurchaseAdminDto.builder()
                .purchaseId(intent.getId())
                .orderId(intent.getOrderId())
                .customerId(intent.getCustomerId())
                .amount(intent.getAmount())
                .expiryDate(intent.getExpiryDate())
                .recipientEmail(intent.getRecipientEmail())
                .status(intent.getStatus())
                .giftCardId(intent.getGiftCardId())
                .refundedAmount(intent.getRefundedAmount())
                .refundTransactionId(intent.getRefundTransactionId())
                .createdAt(intent.getCreatedAt())
                .issuedAt(intent.getIssuedAt())
                .refundedAt(intent.getRefundedAt())
                .build();
    }
}
