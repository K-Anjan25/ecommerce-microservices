package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query(value = "SELECT oi2.product_id FROM orderItems oi1 " +
            "JOIN orderItems oi2 ON oi1.order_id = oi2.order_id " +
            "WHERE oi1.product_id = :productId AND oi2.product_id != :productId " +
            "GROUP BY oi2.product_id " +
            "ORDER BY COUNT(*) DESC " +
            "LIMIT 5", nativeQuery = true)
    List<UUID> findBoughtTogether(@Param("productId") UUID productId);
}
