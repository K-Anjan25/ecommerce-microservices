package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GiftCardPurchaseFinalizerTest {
    @Test
    void issuesCardOnlyOnceAfterSuccessfulPayment() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardService cards = mock(GiftCardService.class);
        GiftCardPurchaseFinalizer finalizer = new GiftCardPurchaseFinalizer(intents, cards);
        UUID orderId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        GiftCardPurchaseIntent intent = intent(orderId, customerId);
        UUID cardId = UUID.randomUUID();
        when(intents.findLockedByOrderId(orderId)).thenReturn(Optional.of(intent));
        when(cards.issuePurchasedGiftCard(customerId, intent.getAmount(), intent.getExpiryDate(), intent.getRecipientEmail()))
                .thenReturn(GiftCardDto.builder().id(cardId).build());

        finalizer.applyPaymentStatus(orderId, "SUCCESS");
        finalizer.applyPaymentStatus(orderId, "SUCCESS");

        assertThat(intent.getStatus()).isEqualTo(GiftCardPurchaseStatus.ISSUED);
        assertThat(intent.getGiftCardId()).isEqualTo(cardId);
        assertThat(intent.getIssuedAt()).isNotNull();
        verify(cards, times(1)).issuePurchasedGiftCard(customerId, intent.getAmount(),
                intent.getExpiryDate(), intent.getRecipientEmail());
        verify(intents, times(1)).save(intent);
    }

    @Test
    void failedPaymentMarksIntentWithoutCreatingCard() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardService cards = mock(GiftCardService.class);
        GiftCardPurchaseFinalizer finalizer = new GiftCardPurchaseFinalizer(intents, cards);
        UUID orderId = UUID.randomUUID();
        GiftCardPurchaseIntent intent = intent(orderId, UUID.randomUUID());
        when(intents.findLockedByOrderId(orderId)).thenReturn(Optional.of(intent));

        finalizer.applyPaymentStatus(orderId, "FAILED");

        assertThat(intent.getStatus()).isEqualTo(GiftCardPurchaseStatus.FAILED);
        verify(cards, never()).issuePurchasedGiftCard(any(), any(), any(), any());
        verify(intents).save(intent);
    }

    private GiftCardPurchaseIntent intent(UUID orderId, UUID customerId) {
        return GiftCardPurchaseIntent.builder().id(UUID.randomUUID()).orderId(orderId)
                .customerId(customerId).amount(new BigDecimal("1000.00"))
                .expiryDate(LocalDate.now().plusYears(1))
                .recipientEmail("recipient@example.com")
                .status(GiftCardPurchaseStatus.PENDING_PAYMENT).build();
    }
}
