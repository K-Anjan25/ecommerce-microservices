package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import com.ecommerce.commerce_service.model.PaymentStatus;
import com.ecommerce.commerce_service.repository.PaymentReconciliationCaseRepository;
import com.ecommerce.commerce_service.repository.PaymentRepository;
import com.ecommerce.commerce_service.service.provider.PaymentProviderClient;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Reconciles old provider-pending payments without guessing at settlement. A
 * provider-authenticated terminal snapshot may be applied through the normal
 * locked payment flow; an unavailable/ambiguous snapshot only creates a
 * durable operations case and leaves local reservations untouched.
 */
@Service
@Slf4j
public class PaymentReconciliationService {
    private final PaymentRepository paymentRepository;
    private final PaymentReconciliationCaseRepository caseRepository;
    private final List<PaymentProviderClient> providerClients;
    private final PaymentService paymentService;

    @Autowired
    public PaymentReconciliationService(
            PaymentRepository paymentRepository,
            PaymentReconciliationCaseRepository caseRepository,
            List<PaymentProviderClient> providerClients,
            @Lazy PaymentService paymentService) {
        this.paymentRepository = paymentRepository;
        this.caseRepository = caseRepository;
        this.providerClients = providerClients;
        this.paymentService = paymentService;
    }

    /** Lightweight constructor retained for isolated queue tests. */
    PaymentReconciliationService(PaymentRepository paymentRepository,
                                 PaymentReconciliationCaseRepository caseRepository) {
        this(paymentRepository, caseRepository, List.of(), null);
    }

    @Value("${payment.reconciliation.pending-ttl:PT30M}")
    private Duration pendingTtl = Duration.ofMinutes(30);

    @Value("${payment.reconciliation.batch-size:100}")
    private int batchSize = 100;

    @Value("${payment.reconciliation.resolved-retention:P90D}")
    private Duration resolvedRetention = Duration.ofDays(90);

    @Scheduled(fixedDelayString = "${payment.reconciliation.scan-delay-ms:60000}")
    public void scanStalePendingPayments() {
        // Do not hold a database transaction while making provider HTTP calls.
        // Each successful reconciliation owns its own payment transaction and
        // each queued case is persisted by the repository boundary.
        LocalDateTime cutoff = LocalDateTime.now().minus(pendingTtl);
        int safeBatchSize = Math.max(1, Math.min(batchSize, 500));
        List<Payment> stalePayments = paymentRepository.findStalePendingOnline(
                PaymentStatus.PENDING.name(), PaymentProvider.CASH, cutoff, PageRequest.of(0, safeBatchSize));

        for (Payment payment : stalePayments) {
            reconcileOrOpenCase(payment);
        }
        if (!stalePayments.isEmpty()) {
            log.warn("Payment reconciliation scan inspected {} stale pending online payment(s)", stalePayments.size());
        }
    }

    @Scheduled(fixedDelayString = "${payment.reconciliation.retention-scan-delay-ms:21600000}")
    @Transactional
    public void purgeResolvedCases() {
        LocalDateTime cutoff = LocalDateTime.now().minus(resolvedRetention);
        int deleted = caseRepository.deleteResolvedBefore(PaymentReconciliationCase.RESOLVED, cutoff);
        if (deleted > 0) {
            log.info("Purged {} resolved payment reconciliation case(s) older than {}", deleted, resolvedRetention);
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

    /** Called in the same transaction as a verified webhook/provider transition. */
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

    private void reconcileOrOpenCase(Payment payment) {
        PaymentProviderClient client = providerClients.stream()
                .filter(candidate -> candidate.provider() == payment.getProvider())
                .findFirst()
                .orElse(null);

        if (client == null || paymentService == null) {
            openCaseIfNeeded(payment);
            return;
        }

        ProviderPaymentStatus snapshot = client.lookup(payment);
        if (!snapshot.isSettled() && !snapshot.isFailed()) {
            openCaseIfNeeded(payment);
            return;
        }

        try {
            // The provider API response is authenticated with the provider
            // secret, but PaymentService still rechecks amount and currency.
            paymentService.reconcileProviderPayment(
                    payment.getProvider(), payment.getTransactionId(), snapshot.isSettled(),
                    snapshot.getFailureReason(), snapshot.getAmount(), snapshot.getCurrency());
        } catch (RuntimeException reconciliationFailure) {
            // Mismatch, missing fields or a provider race must become visible
            // to operations; never release local reservations speculatively.
            openCaseIfNeeded(payment);
            log.error("Provider status for payment {} could not be applied; case retained for review",
                    payment.getId(), reconciliationFailure);
        }
    }

    private void openCaseIfNeeded(Payment payment) {
        if (payment.getId() == null || payment.getOrderId() == null
                || payment.getProvider() == null || payment.getAmount() == null
                || payment.getCurrency() == null) {
            log.error("Skipping incomplete payment {} during reconciliation scan", payment.getId());
            return;
        }
        // A payment has a single lifecycle. Once a case has been resolved by a
        // verified callback or provider API snapshot, it must not be reopened.
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
