package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/** Mints purchased stored value only after PaymentService has verified settlement. */
@Service
@RequiredArgsConstructor
@Slf4j
public class GiftCardPurchaseFinalizer {
    private final GiftCardPurchaseIntentRepository intentRepository;
    private final GiftCardService giftCardService;

    @Transactional
    public void applyPaymentStatus(UUID orderId, String paymentStatus) {
        GiftCardPurchaseIntent intent = intentRepository.findLockedByOrderId(orderId).orElse(null);
        if (intent == null) {
            return;
        }

        if ("SUCCESS".equalsIgnoreCase(paymentStatus)) {
            if (intent.getStatus() == GiftCardPurchaseStatus.ISSUED) {
                return;
            }
            if (intent.getStatus() != GiftCardPurchaseStatus.PENDING_PAYMENT) {
                log.warn("Ignoring successful payment for gift-card purchase {} in state {}",
                        intent.getId(), intent.getStatus());
                return;
            }
            GiftCardDto card = giftCardService.issuePurchasedGiftCard(
                    intent.getCustomerId(), intent.getAmount(), intent.getExpiryDate(), intent.getRecipientEmail());
            intent.setGiftCardId(card.getId());
            intent.setStatus(GiftCardPurchaseStatus.ISSUED);
            intent.setIssuedAt(LocalDateTime.now());
            intent.setUpdatedAt(LocalDateTime.now());
            intentRepository.save(intent);
            log.info("Issued gift card {} for settled purchase {}", card.getId(), intent.getId());
        } else if ("FAILED".equalsIgnoreCase(paymentStatus)
                && intent.getStatus() == GiftCardPurchaseStatus.PENDING_PAYMENT) {
            intent.setStatus(GiftCardPurchaseStatus.FAILED);
            intent.setUpdatedAt(LocalDateTime.now());
            intentRepository.save(intent);
        }
    }
}
