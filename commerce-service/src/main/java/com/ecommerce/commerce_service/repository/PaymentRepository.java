package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(UUID orderId);
}
