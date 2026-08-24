package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.PaymentOutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import javax.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface PaymentOutboxRepository extends JpaRepository<PaymentOutboxEvent, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<PaymentOutboxEvent> findTop50ByNextAttemptAtLessThanEqualOrderByCreatedAtAsc(LocalDateTime now);
}
