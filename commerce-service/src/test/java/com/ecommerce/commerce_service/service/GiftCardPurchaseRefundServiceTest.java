package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.model.GiftCard;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.model.GiftCardStatus;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import com.ecommerce.commerce_service.repository.GiftCardRepository;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentResult;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GiftCardPurchaseRefundServiceTest {
    @Test
    void refundsOnlyUnusedValueAndIsIdempotent() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardRepository cards = mock(GiftCardRepository.class);
        PaymentService payments = mock(PaymentService.class);
        GiftCardPurchaseRefundService service = new GiftCardPurchaseRefundService(intents, cards, payments);
        UUID purchaseId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();
        GiftCardPurchaseIntent intent = GiftCardPurchaseIntent.builder().id(purchaseId).orderId(orderId)
                .giftCardId(cardId).status(GiftCardPurchaseStatus.ISSUED).build();
        GiftCard card = GiftCard.builder().id(cardId).balance(new BigDecimal("700.00"))
                .initialBalance(new BigDecimal("1000.00")).status(GiftCardStatus.ACTIVE)
                .expiryDate(LocalDate.now().plusMonths(6)).build();
        when(intents.findLockedById(purchaseId)).thenReturn(Optional.of(intent));
        when(cards.findLockedById(cardId)).thenReturn(Optional.of(card));
        when(payments.refundOrderPayment(orderId, new BigDecimal("700.00"),
                "gift-card-purchase-refund-" + purchaseId))
                .thenReturn(ProviderPaymentResult.builder().success(true).transactionId("re_123").build());

        var first = service.refund(purchaseId);
        var second = service.refund(purchaseId);

        assertThat(first.getRefundedAmount()).isEqualByComparingTo("700.00");
        assertThat(first.getStatus()).isEqualTo(GiftCardPurchaseStatus.REFUNDED);
        assertThat(second.getRefundTransactionId()).isEqualTo("re_123");
        assertThat(card.getBalance()).isEqualByComparingTo("0.00");
        assertThat(card.getStatus()).isEqualTo(GiftCardStatus.REFUNDED);
        verify(payments, times(1)).refundOrderPayment(orderId, new BigDecimal("700.00"),
                "gift-card-purchase-refund-" + purchaseId);
        verify(cards, times(1)).save(card);
        verify(intents, times(1)).save(intent);
    }

    @Test
    void rejectsSpentCardWithoutCallingProvider() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardRepository cards = mock(GiftCardRepository.class);
        PaymentService payments = mock(PaymentService.class);
        GiftCardPurchaseRefundService service = new GiftCardPurchaseRefundService(intents, cards, payments);
        UUID cardId = UUID.randomUUID();
        GiftCardPurchaseIntent intent = GiftCardPurchaseIntent.builder().id(UUID.randomUUID())
                .orderId(UUID.randomUUID()).giftCardId(cardId).status(GiftCardPurchaseStatus.ISSUED).build();
        when(intents.findLockedById(intent.getId())).thenReturn(Optional.of(intent));
        when(cards.findLockedById(cardId)).thenReturn(Optional.of(GiftCard.builder()
                .id(cardId).balance(BigDecimal.ZERO).status(GiftCardStatus.REDEEMED).build()));

        assertThatThrownBy(() -> service.refund(intent.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("spent");
        verifyNoInteractions(payments);
        verify(cards, never()).save(any());
    }

    @Test
    void rejectsUnsettledPurchaseBeforeLoadingCard() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardRepository cards = mock(GiftCardRepository.class);
        PaymentService payments = mock(PaymentService.class);
        GiftCardPurchaseRefundService service = new GiftCardPurchaseRefundService(intents, cards, payments);
        GiftCardPurchaseIntent intent = GiftCardPurchaseIntent.builder().id(UUID.randomUUID())
                .orderId(UUID.randomUUID()).status(GiftCardPurchaseStatus.PENDING_PAYMENT).build();
        when(intents.findLockedById(intent.getId())).thenReturn(Optional.of(intent));

        assertThatThrownBy(() -> service.refund(intent.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("issued");
        verifyNoInteractions(cards, payments);
    }
}
