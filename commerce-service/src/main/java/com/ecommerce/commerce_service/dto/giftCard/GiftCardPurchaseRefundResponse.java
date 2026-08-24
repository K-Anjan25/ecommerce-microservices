package com.ecommerce.commerce_service.dto.giftCard;

import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class GiftCardPurchaseRefundResponse {
    private UUID purchaseId;
    private UUID orderId;
    private GiftCardPurchaseStatus status;
    private BigDecimal refundedAmount;
    private String refundTransactionId;
    private LocalDateTime refundedAt;
}
