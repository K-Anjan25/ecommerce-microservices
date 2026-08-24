package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import javax.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(UUID orderId);
    Optional<Payment> findByProviderAndTransactionId(PaymentProvider provider, String transactionId);

    /** Finds old online payments without treating COD as a provider reconciliation case. */
    @Query("SELECT p FROM Payment p WHERE p.status = :status AND p.provider <> :cashProvider "
            + "AND ((p.updatedAt IS NOT NULL AND p.updatedAt <= :cutoff) "
            + "OR (p.updatedAt IS NULL AND p.createdAt <= :cutoff)) ORDER BY p.createdAt ASC")
    List<Payment> findStalePendingOnline(@Param("status") String status,
                                         @Param("cashProvider") PaymentProvider cashProvider,
                                         @Param("cutoff") LocalDateTime cutoff,
                                         Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.provider = :provider AND p.transactionId = :transactionId")
    Optional<Payment> findLockedByProviderAndTransactionId(@Param("provider") PaymentProvider provider,
                                                           @Param("transactionId") String transactionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.orderId = :orderId")
    Optional<Payment> findLockedByOrderId(@Param("orderId") UUID orderId);
}
