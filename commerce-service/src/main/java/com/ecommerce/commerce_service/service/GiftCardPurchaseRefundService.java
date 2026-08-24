package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardPurchaseRefundResponse;
import com.ecommerce.commerce_service.model.GiftCard;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.model.GiftCardStatus;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import com.ecommerce.commerce_service.repository.GiftCardRepository;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

/** Refunds only the unused value of a settled customer gift-card purchase. */
@Service
@RequiredArgsConstructor
public class GiftCardPurchaseRefundService {
    private final GiftCardPurchaseIntentRepository intentRepository;
    private final GiftCardRepository giftCardRepository;
    private final PaymentService paymentService;

    @Transactional
    public GiftCardPurchaseRefundResponse refund(UUID purchaseId) {
        GiftCardPurchaseIntent intent = intentRepository.findLockedById(purchaseId)
                .orElseThrow(() -> new IllegalArgumentException("Gift-card purchase not found"));
        if (intent.getStatus() == GiftCardPurchaseStatus.REFUNDED) {
            return response(intent);
        }
        if (intent.getStatus() != GiftCardPurchaseStatus.ISSUED) {
            throw new IllegalArgumentException("Only an issued gift-card purchase can be refunded");
        }

        if (intent.getGiftCardId() == null) {
            throw new IllegalStateException("Gift card for purchase has not been issued");
        }
        GiftCard card = giftCardRepository.findLockedById(intent.getGiftCardId())
                .orElseThrow(() -> new IllegalStateException("Gift card for purchase no longer exists"));
        if (card.getStatus() == GiftCardStatus.REDEEMED
                || card.getStatus() == GiftCardStatus.REFUNDED) {
            throw new IllegalArgumentException("A spent or already refunded gift card cannot be refunded");
        }
        BigDecimal unusedBalance = nvl(card.getBalance()).setScale(2, RoundingMode.UNNECESSARY);
        if (unusedBalance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Gift card has no unused balance to refund");
        }

        ProviderPaymentResult providerResult = paymentService.refundOrderPayment(
                intent.getOrderId(), unusedBalance, "gift-card-purchase-refund-" + intent.getId());
        if (!providerResult.isSuccess()) {
            throw new IllegalArgumentException("Gift-card refund failed: " + providerResult.getMessage());
        }

        card.setBalance(BigDecimal.ZERO.setScale(2));
        card.setStatus(GiftCardStatus.REFUNDED);
        giftCardRepository.save(card);

        intent.setStatus(GiftCardPurchaseStatus.REFUNDED);
        intent.setRefundedAmount(unusedBalance);
        intent.setRefundTransactionId(providerResult.getTransactionId());
        intent.setRefundedAt(LocalDateTime.now());
        intent.setUpdatedAt(LocalDateTime.now());
        intentRepository.save(intent);
        return response(intent);
    }

    private GiftCardPurchaseRefundResponse response(GiftCardPurchaseIntent intent) {
        return GiftCardPurchaseRefundResponse.builder()
                .purchaseId(intent.getId())
                .orderId(intent.getOrderId())
                .status(intent.getStatus())
                .refundedAmount(intent.getRefundedAmount())
                .refundTransactionId(intent.getRefundTransactionId())
                .refundedAt(intent.getRefundedAt())
                .build();
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
