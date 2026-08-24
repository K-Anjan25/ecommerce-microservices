package com.ecommerce.user_service.config;

import com.ecommerce.user_service.model.EmailRetryStatus;
import com.ecommerce.user_service.repository.EmailRetryEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/** Exposes mail retry pressure without exposing encrypted email payloads. */
@Component("emailDelivery")
@RequiredArgsConstructor
public class EmailRetryHealthIndicator implements HealthIndicator {
    private final EmailRetryEventRepository repository;

    @Value("${email.outbox.health-dead-threshold:10}")
    private long deadRetryThreshold = 10;

    @Override
    public Health health() {
        try {
            long deadRetries = repository.countByStatus(EmailRetryStatus.DEAD);
            long pendingRetries = repository.countByStatus(EmailRetryStatus.PENDING);
            Health.Builder builder = Health.up()
                    .withDetail("pendingRetries", pendingRetries)
                    .withDetail("deadRetries", deadRetries)
                    .withDetail("threshold", deadRetryThreshold)
                    .withDetail("action", "review Admin > Email delivery");
            if (deadRetries > deadRetryThreshold) {
                builder.withDetail("warning", "dead email retries exceed threshold");
            }
            return builder.build();
        } catch (RuntimeException failure) {
            return Health.unknown()
                    .withDetail("reason", "email retry status unavailable")
                    .build();
        }
    }
}
