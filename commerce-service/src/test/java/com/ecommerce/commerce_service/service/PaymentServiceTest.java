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
        when(orders.findLockedById(orderId)).thenReturn(order);
        when(cash.provider()).thenReturn(PaymentProvider.CASH);
        when(cash.charge(any())).thenReturn(ProviderPaymentResult.builder().success(true).transactionId("cash-1").build());
        when(payments.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        PaymentService service = new PaymentService(payments, orders, producer, List.of(cash), invoices, tokens, mock(LoyaltyPointService.class), mock(OrderService.class));
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
        when(orders.findLockedById(orderId)).thenReturn(order);
        PaymentService service = new PaymentService(payments, orders, mock(RabbitMQMessageProducer.class),
                List.of(), mock(InvoiceService.class), new CheckoutTokenService(), mock(LoyaltyPointService.class), mock(OrderService.class));
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(orderId);
        request.setProvider(PaymentProvider.CASH);

        assertThatThrownBy(() -> service.processPayment(request, UUID.randomUUID()))
                .isInstanceOf(SecurityException.class);
    }
    @Test
    void duplicatePaymentIsRejectedAfterOrderLockWithoutCallingProvider() {
        PaymentRepository payments = mock(PaymentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        PaymentProviderClient provider = mock(PaymentProviderClient.class);
        UUID orderId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).customerId(customerId)
                .orderStatus(OrderStatus.PENDING).totalAmount(BigDecimal.TEN).build();
        when(orders.findLockedById(orderId)).thenReturn(order);
        when(payments.findByOrderId(orderId)).thenReturn(Optional.of(Payment.builder().orderId(orderId).build()));
        PaymentService service = new PaymentService(payments, orders, mock(RabbitMQMessageProducer.class),
                List.of(provider), mock(InvoiceService.class), new CheckoutTokenService(),
                mock(LoyaltyPointService.class), mock(OrderService.class));
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(orderId);
        request.setProvider(PaymentProvider.RAZORPAY);

        assertThatThrownBy(() -> service.processPayment(request, customerId))
                .isInstanceOf(com.ecommerce.commerce_service.exception.DuplicatePaymentException.class);
        verify(orders).findLockedById(orderId);
        verifyNoInteractions(provider);
    }

    @Test
    void verifiedSettlementReconcilesPendingPaymentExactlyOnce() {
        PaymentRepository payments = mock(PaymentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        OrderService orderService = mock(OrderService.class);
        LoyaltyPointService loyalty = mock(LoyaltyPointService.class);
        UUID orderId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        String reference = "pi_pending_1";
        Payment payment = Payment.builder().id(9L).orderId(orderId).userId(customerId)
                .provider(PaymentProvider.STRIPE).transactionId(reference)
                .amount(new BigDecimal("120.00")).currency("INR")
                .status(PaymentStatus.PENDING.name()).build();
        Order order = Order.builder().id(orderId).customerId(customerId)
                .orderStatus(OrderStatus.PENDING).totalAmount(new BigDecimal("120.00")).build();
        when(payments.findByProviderAndTransactionId(PaymentProvider.STRIPE, reference))
                .thenReturn(Optional.of(payment));
        when(payments.findLockedByProviderAndTransactionId(PaymentProvider.STRIPE, reference))
                .thenReturn(Optional.of(payment));
        when(orders.findLockedById(orderId)).thenReturn(order);
        when(payments.save(payment)).thenReturn(payment);
        PaymentService service = new PaymentService(payments, orders, mock(RabbitMQMessageProducer.class),
                List.of(), mock(InvoiceService.class), new CheckoutTokenService(), loyalty, orderService);

        service.reconcileProviderPayment(PaymentProvider.STRIPE, reference, true, null);
        service.reconcileProviderPayment(PaymentProvider.STRIPE, reference, true, null);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS.name());
        verify(payments, times(1)).save(payment);
        verify(orderService, times(1)).applyPaymentStatus(orderId, PaymentStatus.SUCCESS.name(), "STRIPE");
        verify(loyalty, times(1)).earnPoints(customerId, new BigDecimal("120.00"), "Paid order #" + orderId);
    }

    @Test
    void rejectsRefundBeyondCapturedProviderAmount() {
        PaymentRepository payments = mock(PaymentRepository.class);
        UUID orderId = UUID.randomUUID();
        Payment payment = Payment.builder().orderId(orderId).amount(new BigDecimal("100.00"))
                .refundedAmount(new BigDecimal("80.00")).provider(PaymentProvider.RAZORPAY)
                .status(PaymentStatus.SUCCESS.name()).build();
        when(payments.findLockedByOrderId(orderId)).thenReturn(Optional.of(payment));
        PaymentService service = new PaymentService(payments, mock(OrderRepository.class),
                mock(RabbitMQMessageProducer.class), List.of(), mock(InvoiceService.class),
                new CheckoutTokenService(), mock(LoyaltyPointService.class), mock(OrderService.class));

        assertThatThrownBy(() -> service.refundOrderPayment(orderId, new BigDecimal("30.00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds");
        verify(payments, never()).save(any());
    }

}
