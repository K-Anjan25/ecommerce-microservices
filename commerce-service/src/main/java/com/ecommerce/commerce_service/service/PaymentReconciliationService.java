package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import com.ecommerce.commerce_service.model.PaymentStatus;
import com.ecommerce.commerce_service.repository.PaymentReconciliationCaseRepository;
import com.ecommerce.commerce_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Keeps provider-pending payments visible to operations without guessing at
 * settlement. A stale payment remains pending until a signed provider webhook
 * proves success or failure; this service only creates and resolves work items.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentReconciliationService {
    private final PaymentRepository paymentRepository;
    private final PaymentReconciliationCaseRepository caseRepository;

    @Value("${payment.reconciliation.pending-ttl:PT30M}")
    private Duration pendingTtl = Duration.ofMinutes(30);

    @Value("${payment.reconciliation.batch-size:100}")
    private int batchSize = 100;

    @Scheduled(fixedDelayString = "${payment.reconciliation.scan-delay-ms:60000}")
    @Transactional
    public void scanStalePendingPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minus(pendingTtl);
        int safeBatchSize = Math.max(1, Math.min(batchSize, 500));
        List<Payment> stalePayments = paymentRepository.findStalePendingOnline(
                PaymentStatus.PENDING.name(), PaymentProvider.CASH, cutoff, PageRequest.of(0, safeBatchSize));

        for (Payment payment : stalePayments) {
            openCaseIfNeeded(payment);
        }
        if (!stalePayments.isEmpty()) {
            log.warn("Payment reconciliation scan found {} stale pending online payment(s)", stalePayments.size());
        }
    }

    @Transactional(readOnly = true)
    public List<PaymentReconciliationCase> findByStatus(String status) {
        if (!PaymentReconciliationCase.OPEN.equals(status)
                && !PaymentReconciliationCase.RESOLVED.equals(status)) {
            throw new IllegalArgumentException("Reconciliation status must be OPEN or RESOLVED");
        }
        return caseRepository.findByStatusOrderByCreatedAtAsc(status);
    }

    /** Called in the same transaction as the verified payment state transition. */
    public void resolveForPayment(Long paymentId, String resolutionReason) {
        if (paymentId == null) {
            return;
        }
        caseRepository.findByPaymentIdAndStatus(paymentId, PaymentReconciliationCase.OPEN)
                .ifPresent(item -> {
                    item.setStatus(PaymentReconciliationCase.RESOLVED);
                    item.setResolvedAt(LocalDateTime.now());
                    item.setUpdatedAt(LocalDateTime.now());
                    if (resolutionReason != null && !resolutionReason.isBlank()) {
                        item.setReason(item.getReason() + " Resolution: " + resolutionReason);
                    }
                    caseRepository.save(item);
                    log.info("Resolved payment reconciliation case {} for payment {}", item.getId(), paymentId);
                });
    }

    private void openCaseIfNeeded(Payment payment) {
        if (payment.getId() == null || payment.getOrderId() == null
                || payment.getProvider() == null || payment.getAmount() == null
                || payment.getCurrency() == null) {
            log.error("Skipping incomplete payment {} during reconciliation scan", payment.getId());
            return;
        }
        // A payment has a single lifecycle. Once a case has been resolved by a
        // verified callback, it must not be reopened by a later scan.
        if (caseRepository.findByPaymentId(payment.getId()).isPresent()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        caseRepository.save(PaymentReconciliationCase.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .provider(payment.getProvider())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(PaymentReconciliationCase.OPEN)
                .reason("Provider payment remained pending beyond " + pendingTtl
                        + "; verify provider status before taking any local action")
                .createdAt(now)
                .updatedAt(now)
                .build());
    }
}
