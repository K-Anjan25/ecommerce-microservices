package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.CreateGiftCardPurchaseRequest;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import com.ecommerce.commerce_service.repository.OrderRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GiftCardPurchaseServiceTest {
    @Test
    void createsPendingPurchaseOrderWithoutMintingCard() {
        OrderRepository orders = mock(OrderRepository.class);
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardPurchaseService service = new GiftCardPurchaseService(orders, intents);
        UUID customerId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID purchaseId = UUID.randomUUID();
        CreateGiftCardPurchaseRequest request = request(PaymentProvider.STRIPE);
        when(orders.save(any())).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(orderId);
            return order;
        });
        when(intents.save(any())).thenAnswer(invocation -> {
            GiftCardPurchaseIntent intent = invocation.getArgument(0);
            intent.setId(purchaseId);
            return intent;
        });

        GiftCardPurchaseService.PurchaseStart result = service.create(request, customerId);

        assertThat(result.getPurchaseId()).isEqualTo(purchaseId);
        assertThat(result.getOrderId()).isEqualTo(orderId);
        assertThat(result.getPaymentRequest().getOrderId()).isEqualTo(orderId);
        assertThat(result.getPaymentRequest().getProvider()).isEqualTo(PaymentProvider.STRIPE);
        verify(intents).save(argThat(intent -> intent.getStatus() == GiftCardPurchaseStatus.PENDING_PAYMENT
                && intent.getAmount().compareTo(new BigDecimal("1000.00")) == 0
                && intent.getCustomerId().equals(customerId)));
    }

    @Test
    void rejectsCashAndAmountsWithMoreThanTwoDecimals() {
        OrderRepository orders = mock(OrderRepository.class);
        GiftCardPurchaseIntentRepository intents = mock(GiftCardPurchaseIntentRepository.class);
        GiftCardPurchaseService service = new GiftCardPurchaseService(orders, intents);
        CreateGiftCardPurchaseRequest cash = request(PaymentProvider.CASH);

        assertThatThrownBy(() -> service.create(cash, UUID.randomUUID()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("online provider");
        CreateGiftCardPurchaseRequest fractional = request(PaymentProvider.STRIPE);
        fractional.setAmount(new BigDecimal("10.001"));
        assertThatThrownBy(() -> service.create(fractional, UUID.randomUUID()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("two decimal places");
        verifyNoInteractions(orders, intents);
    }

    private CreateGiftCardPurchaseRequest request(PaymentProvider provider) {
        CreateGiftCardPurchaseRequest request = new CreateGiftCardPurchaseRequest();
        request.setAmount(new BigDecimal("1000.00"));
        request.setContactEmail("buyer@example.com");
        request.setRecipientEmail("recipient@example.com");
        request.setExpiryDate(LocalDate.now().plusYears(1));
        request.setProvider(provider);
        return request;
    }
}
