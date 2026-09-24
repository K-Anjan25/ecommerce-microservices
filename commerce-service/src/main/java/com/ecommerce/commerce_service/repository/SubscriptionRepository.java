package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Subscription;
import com.ecommerce.commerce_service.model.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    List<Subscription> findByCustomerIdOrderByCreatedDateDesc(UUID customerId);

    /** Active auto-reorders due for placement (paused and skipped handled in code). */
    List<Subscription> findByStatusAndNextRunAtBefore(SubscriptionStatus status, LocalDateTime now);

    /** Active cycles whose pre-delivery reminder has not fired yet. */
    List<Subscription> findByStatusAndReminderSentAtIsNullAndNextRunAtBefore(
            SubscriptionStatus status, LocalDateTime deadline);

    /** Batching window for the 15% tier: how many deliveries land this calendar month. */
    long countByStatusAndNextRunAtBetween(SubscriptionStatus status, LocalDateTime from, LocalDateTime to);

    /** Admin: upcoming auto-reorder demand. */
    List<Subscription> findByStatusAndNextRunAtBetweenOrderByNextRunAtAsc(
            SubscriptionStatus status, LocalDateTime from, LocalDateTime to);

    List<Subscription> findByCustomerIdAndStatusNot(UUID customerId, SubscriptionStatus status);
}
