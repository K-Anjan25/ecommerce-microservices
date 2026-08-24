package com.ecommerce.commerce_service.config;

import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import com.ecommerce.commerce_service.repository.PaymentReconciliationCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/** Exposes reconciliation pressure without treating business work as a service outage. */
@Component("paymentReconciliation")
@RequiredArgsConstructor
public class PaymentReconciliationHealthIndicator implements HealthIndicator {
    private final PaymentReconciliationCaseRepository repository;

    @Value("${payment.reconciliation.health-open-case-threshold:100}")
    private long openCaseThreshold = 100;

    @Override
    public Health health() {
        try {
            long openCases = repository.countByStatus(PaymentReconciliationCase.OPEN);
            Health.Builder builder = Health.up()
                    .withDetail("openCases", openCases)
                    .withDetail("threshold", openCaseThreshold)
                    .withDetail("action", "review Admin > Payment review");
            if (openCases > openCaseThreshold) {
                builder.withDetail("warning", "open reconciliation cases exceed threshold");
            }
            return builder.build();
        } catch (RuntimeException failure) {
            return Health.unknown()
                    .withDetail("reason", "reconciliation queue status unavailable")
                    .build();
        }
    }
}
