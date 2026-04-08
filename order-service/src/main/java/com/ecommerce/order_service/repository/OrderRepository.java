package com.ecommerce.order_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ecommerce.order_service.model.Order;

import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
}