package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
}
