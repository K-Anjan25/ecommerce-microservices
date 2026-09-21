package com.ecommerce.commerce_service.newsletter;

import com.ecommerce.commerce_service.dto.newsletter.SubscribeRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final NewsletterSubscriberRepository repository;

    /**
     * Idempotent subscribe: new emails are stored, re-subscribes return the
     * existing record, and previously unsubscribed emails are reactivated.
     */
    @Transactional
    public SubscribeResult subscribe(String email, String source) {
        String normalized = email.trim().toLowerCase();
        LocalDateTime now = LocalDateTime.now();

        return repository.findByEmail(normalized)
                .map(existing -> {
                    if (Boolean.TRUE.equals(existing.getActive())) {
                        return new SubscribeResult(existing, false);
                    }
                    existing.setActive(true);
                    existing.setSource(source);
                    existing.setUpdatedAt(now);
                    NewsletterSubscriber saved = repository.save(existing);
                    log.info("Newsletter re-subscription for {}", saved.getEmail());
                    return new SubscribeResult(saved, false);
                })
                .orElseGet(() -> {
                    NewsletterSubscriber created = repository.save(NewsletterSubscriber.builder()
                            .email(normalized)
                            .source(source)
                            .active(Boolean.TRUE)
                            .createdAt(now)
                            .updatedAt(now)
                            .build());
                    log.info("Newsletter subscription for {}", created.getEmail());
                    return new SubscribeResult(created, true);
                });
    }

    /** Record plus whether this call created it (vs. already/idempotent return). */
    public record SubscribeResult(NewsletterSubscriber subscriber, boolean newlyCreated) {
        public String status() {
            return newlyCreated || Boolean.FALSE.equals(subscriber.getActive())
                    ? "SUBSCRIBED"
                    : "ALREADY_SUBSCRIBED";
        }
    }
}
