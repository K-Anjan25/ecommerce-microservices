package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.payment.PaymentRequest;
import com.ecommerce.commerce_service.model.*;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.PaymentRepository;
import com.ecommerce.commerce_service.service.provider.PaymentProviderClient;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentResult;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTest {
    @Test
    void derivesAmountFromOwnedOrder() {
        PaymentRepository payments = mock(PaymentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        RabbitMQMessageProducer producer = mock(RabbitMQMessageProducer.class);
        PaymentProviderClient cash = mock(PaymentProviderClient.class);
        InvoiceService invoices = mock(InvoiceService.class);
        CheckoutTokenService tokens = new CheckoutTokenService();
        UUID orderId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).customerId(customerId).customerEmail("a@example.com")
                .orderStatus(OrderStatus.PENDING).totalAmount(new BigDecimal("3499.50")).build();
        when(payments.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(cash.provider()).thenReturn(PaymentProvider.CASH);
        when(cash.charge(any())).thenReturn(ProviderPaymentResult.builder().success(true).transactionId("cash-1").build());
        when(payments.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        PaymentService service = new PaymentService(payments, orders, producer, List.of(cash), invoices, tokens);
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(orderId);
        request.setProvider(PaymentProvider.CASH);

        var response = service.processPayment(request, customerId);

        assertThat(response.getAmount()).isEqualByComparingTo("3499.50");
        assertThat(response.getCurrency()).isEqualTo("INR");
    }

    @Test
    void rejectsPaymentForAnotherCustomersOrder() {
        PaymentRepository payments = mock(PaymentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).customerId(UUID.randomUUID())
                .orderStatus(OrderStatus.PENDING).totalAmount(BigDecimal.TEN).build();
        when(payments.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        PaymentService service = new PaymentService(payments, orders, mock(RabbitMQMessageProducer.class),
                List.of(), mock(InvoiceService.class), new CheckoutTokenService());
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(orderId);
        request.setProvider(PaymentProvider.CASH);

        assertThatThrownBy(() -> service.processPayment(request, UUID.randomUUID()))
                .isInstanceOf(SecurityException.class);
    }
}
