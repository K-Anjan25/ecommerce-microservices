package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, UUID> {
    List<OrderStatusHistory> findByOrderIdOrderByChangedAtAsc(UUID orderId);
}