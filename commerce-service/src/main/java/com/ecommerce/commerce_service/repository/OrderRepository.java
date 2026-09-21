package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerIdOrderByCreatedDateDesc(UUID customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM orders o WHERE o.id = :id")
    Order findLockedById(@Param("id") UUID id);

    /**
     * True when the customer has a non-cancelled order containing the product
     * — powers the verified-purchase badge on reviews.
     */
    @Query(
            "SELECT COUNT(oi) > 0 FROM orders o JOIN o.items oi"
            + " WHERE o.customerId = :customerId AND oi.productId = :productId"
            + " AND o.orderStatus <> com.ecommerce.commerce_service.model.OrderStatus.CANCELLED")
    boolean existsActivePurchase(
            @Param("customerId") UUID customerId, @Param("productId") UUID productId);
}
