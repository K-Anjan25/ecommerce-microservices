package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.OrderStatusHistoryRepository;
import com.ecommerce.commerce_service.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Duration;
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
        GiftCardPurchaseFinalizer finalizer = new GiftCardPurchaseFinalizer(intents, cards, mock(PaymentRepository.class), mock(OrderRepository.class), mock(OrderStatusHistoryRepository.class));
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
        GiftCardPurchaseFinalizer finalizer = new GiftCardPurchaseFinalizer(intents, cards, mock(PaymentRepository.class), mock(OrderRepository.class), mock(OrderStatusHistoryRepository.class));
        UUID orderId = UUID.randomUUID();
        GiftCardPurchaseIntent intent = intent(orderId, UUID.randomUUID());
        when(intents.findLockedByOrderId(orderId)).thenReturn(Optional.of(intent));

        finalizer.applyPaymentStatus(orderId, "FAILED");

        assertThat(intent.getStatus()).isEqualTo(GiftCardPurchaseStatus.FAILED);
        verify(cards, never()).issuePurchasedGiftCard(any(), any(), any(), any());
        verify(intents).save(intent);
    }

    @Test
    void lifecycleClosesIntentWhenLinkedPaymentHasFailed() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardService cards = mock(GiftCardService.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        OrderStatusHistoryRepository history = mock(OrderStatusHistoryRepository.class);
        GiftCardPurchaseFinalizer finalizer = service(intents, cards, payments, orders, history);
        GiftCardPurchaseIntent intent = intent(UUID.randomUUID(), UUID.randomUUID());
        intent.setCreatedAt(java.time.LocalDateTime.now());
        when(intents.findByStatusOrderByCreatedAtAsc(eq(GiftCardPurchaseStatus.PENDING_PAYMENT), any(Pageable.class)))
                .thenReturn(java.util.List.of(intent));
        when(payments.findByOrderId(intent.getOrderId())).thenReturn(Optional.of(
                com.ecommerce.commerce_service.model.Payment.builder().status("FAILED").build()));

        finalizer.expireAbandonedPurchases();

        assertThat(intent.getStatus()).isEqualTo(GiftCardPurchaseStatus.FAILED);
        verify(intents).save(intent);
        verifyNoInteractions(orders, history, cards);
    }

    @Test
    void lifecycleCancelsUnstartedExpiredPurchase() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardService cards = mock(GiftCardService.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        OrderStatusHistoryRepository history = mock(OrderStatusHistoryRepository.class);
        GiftCardPurchaseFinalizer finalizer = service(intents, cards, payments, orders, history);
        UUID orderId = UUID.randomUUID();
        GiftCardPurchaseIntent intent = intent(orderId, UUID.randomUUID());
        intent.setCreatedAt(java.time.LocalDateTime.now().minusHours(2));
        Order order = Order.builder().id(orderId).orderStatus(OrderStatus.PENDING).build();
        when(intents.findByStatusOrderByCreatedAtAsc(eq(GiftCardPurchaseStatus.PENDING_PAYMENT), any(Pageable.class)))
                .thenReturn(java.util.List.of(intent));
        when(payments.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(history.existsByOrderIdAndStatusAndNote(eq(orderId), eq(OrderStatus.CANCELLED), anyString()))
                .thenReturn(false);

        finalizer.expireAbandonedPurchases();

        assertThat(intent.getStatus()).isEqualTo(GiftCardPurchaseStatus.FAILED);
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(orders).save(order);
        verify(history).save(any());
    }

    @Test
    void lifecycleLeavesLiveProviderPaymentUntouched() {
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardService cards = mock(GiftCardService.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        OrderStatusHistoryRepository history = mock(OrderStatusHistoryRepository.class);
        GiftCardPurchaseFinalizer finalizer = service(intents, cards, payments, orders, history);
        GiftCardPurchaseIntent intent = intent(UUID.randomUUID(), UUID.randomUUID());
        intent.setCreatedAt(java.time.LocalDateTime.now().minusHours(2));
        when(intents.findByStatusOrderByCreatedAtAsc(eq(GiftCardPurchaseStatus.PENDING_PAYMENT), any(Pageable.class)))
                .thenReturn(java.util.List.of(intent));
        when(payments.findByOrderId(intent.getOrderId())).thenReturn(Optional.of(
                com.ecommerce.commerce_service.model.Payment.builder().status("PENDING").build()));

        finalizer.expireAbandonedPurchases();

        assertThat(intent.getStatus()).isEqualTo(GiftCardPurchaseStatus.PENDING_PAYMENT);
        verify(intents, never()).save(any());
        verifyNoInteractions(orders, history, cards);
    }

    private GiftCardPurchaseFinalizer service(GiftCardPurchaseIntentRepository intents,
                                              GiftCardService cards,
                                              PaymentRepository payments,
                                              OrderRepository orders,
                                              OrderStatusHistoryRepository history) {
        GiftCardPurchaseFinalizer finalizer = new GiftCardPurchaseFinalizer(intents, cards, payments, orders, history);
        ReflectionTestUtils.setField(finalizer, "pendingTtl", Duration.ofMinutes(30));
        ReflectionTestUtils.setField(finalizer, "batchSize", 100);
        return finalizer;
    }

    private GiftCardPurchaseIntent intent(UUID orderId, UUID customerId) {
        return GiftCardPurchaseIntent.builder().id(UUID.randomUUID()).orderId(orderId)
                .customerId(customerId).amount(new BigDecimal("1000.00"))
                .expiryDate(LocalDate.now().plusYears(1))
                .recipientEmail("recipient@example.com")
                .status(GiftCardPurchaseStatus.PENDING_PAYMENT).build();
    }
}
