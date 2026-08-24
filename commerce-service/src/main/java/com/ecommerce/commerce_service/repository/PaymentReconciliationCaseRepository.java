package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentReconciliationCaseRepository extends JpaRepository<PaymentReconciliationCase, UUID> {
    Optional<PaymentReconciliationCase> findByPaymentIdAndStatus(Long paymentId, String status);

    Optional<PaymentReconciliationCase> findByPaymentId(Long paymentId);

    List<PaymentReconciliationCase> findByStatusOrderByCreatedAtAsc(String status);
}
