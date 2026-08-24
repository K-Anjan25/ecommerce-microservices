package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentReconciliationCaseRepository extends JpaRepository<PaymentReconciliationCase, UUID> {
    Optional<PaymentReconciliationCase> findByPaymentIdAndStatus(Long paymentId, String status);

    Optional<PaymentReconciliationCase> findByPaymentId(Long paymentId);

    List<PaymentReconciliationCase> findByStatusOrderByCreatedAtAsc(String status);

    @Modifying
    @Query("DELETE FROM payment_reconciliation_cases c WHERE c.status = :status "
            + "AND c.resolvedAt IS NOT NULL AND c.resolvedAt < :cutoff")
    int deleteResolvedBefore(@Param("status") String status,
                             @Param("cutoff") LocalDateTime cutoff);
}
