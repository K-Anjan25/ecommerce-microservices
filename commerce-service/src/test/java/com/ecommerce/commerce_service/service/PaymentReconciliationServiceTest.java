package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import com.ecommerce.commerce_service.repository.PaymentReconciliationCaseRepository;
import com.ecommerce.commerce_service.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentReconciliationServiceTest {
    @Test
    void scanCreatesReadOnlyCaseForStaleOnlinePayment() {
        PaymentRepository payments = mock(PaymentRepository.class);
        PaymentReconciliationCaseRepository cases = mock(PaymentReconciliationCaseRepository.class);
        PaymentReconciliationService service = service(payments, cases);
        Payment payment = payment(17L);
        when(payments.findStalePendingOnline(eq("PENDING"), eq(PaymentProvider.CASH), any(), any(Pageable.class)))
                .thenReturn(List.of(payment));
        when(cases.findByPaymentId(payment.getId())).thenReturn(Optional.empty());

        service.scanStalePendingPayments();

        verify(cases).save(argThat(item -> item.getPaymentId().equals(17L)
                && item.getOrderId().equals(payment.getOrderId())
                && item.getProvider() == PaymentProvider.RAZORPAY
                && item.getStatus().equals(PaymentReconciliationCase.OPEN)
                && item.getReason().contains("verify provider status")));
    }

    @Test
    void scanDoesNotDuplicateResolvedOrOpenCase() {
        PaymentRepository payments = mock(PaymentRepository.class);
        PaymentReconciliationCaseRepository cases = mock(PaymentReconciliationCaseRepository.class);
        PaymentReconciliationService service = service(payments, cases);
        Payment payment = payment(18L);
        when(payments.findStalePendingOnline(anyString(), any(), any(), any(Pageable.class)))
                .thenReturn(List.of(payment));
        PaymentReconciliationCase existing = PaymentReconciliationCase.builder()
                .paymentId(payment.getId()).status(PaymentReconciliationCase.RESOLVED).build();
        when(cases.findByPaymentId(payment.getId())).thenReturn(Optional.of(existing));

        service.scanStalePendingPayments();

        verify(cases, never()).save(any());
    }

    @Test
    void verifiedProviderTransitionResolvesOpenCase() {
        PaymentRepository payments = mock(PaymentRepository.class);
        PaymentReconciliationCaseRepository cases = mock(PaymentReconciliationCaseRepository.class);
        PaymentReconciliationService service = service(payments, cases);
        PaymentReconciliationCase item = PaymentReconciliationCase.builder()
                .id(UUID.randomUUID()).paymentId(19L).status(PaymentReconciliationCase.OPEN)
                .reason("pending").build();
        when(cases.findByPaymentIdAndStatus(19L, PaymentReconciliationCase.OPEN))
                .thenReturn(Optional.of(item));

        service.resolveForPayment(19L, "Verified success webhook received");

        assertThat(item.getStatus()).isEqualTo(PaymentReconciliationCase.RESOLVED);
        assertThat(item.getResolvedAt()).isNotNull();
        assertThat(item.getReason()).contains("Verified success webhook received");
        verify(cases).save(item);
    }

    private PaymentReconciliationService service(PaymentRepository payments,
                                                 PaymentReconciliationCaseRepository cases) {
        PaymentReconciliationService service = new PaymentReconciliationService(payments, cases);
        ReflectionTestUtils.setField(service, "pendingTtl", Duration.ofMinutes(30));
        ReflectionTestUtils.setField(service, "batchSize", 100);
        return service;
    }

    private Payment payment(Long id) {
        return Payment.builder().id(id).orderId(UUID.randomUUID()).provider(PaymentProvider.RAZORPAY)
                .transactionId("order_" + id).amount(new BigDecimal("99.00")).currency("INR")
                .status("PENDING").createdAt(LocalDateTime.now().minusHours(1))
                .updatedAt(LocalDateTime.now().minusHours(1)).build();
    }
}
