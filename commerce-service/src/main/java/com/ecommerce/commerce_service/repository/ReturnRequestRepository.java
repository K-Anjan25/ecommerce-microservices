package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, UUID> {
    List<ReturnRequest> findByOrderId(UUID orderId);
    List<ReturnRequest> findByCustomerId(UUID customerId);
}
