package com.ecommerce.commerce_service.dto.giftCard;

import com.ecommerce.commerce_service.dto.payment.PaymentResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class GiftCardPurchaseResponse {
    private UUID purchaseId;
    private UUID orderId;
    private PaymentResponse payment;
}
