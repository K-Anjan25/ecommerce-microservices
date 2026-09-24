package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    List<Subscription> findByCustomerIdOrderByCreatedDateDesc(UUID customerId);

    List<Subscription> findByActiveTrueAndNextRunAtBefore(LocalDateTime now);
}
