package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.LoyaltyPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.UUID;

public interface LoyaltyPointRepository extends JpaRepository<LoyaltyPoint, UUID> {
    List<LoyaltyPoint> findByCustomerIdOrderByCreatedDateDesc(UUID customerId);

    @Query(value = "SELECT COALESCE(SUM(l.points), 0) FROM loyalty_points l WHERE l.customer_id = :customerId", nativeQuery = true)
    Integer sumPointsByCustomerId(UUID customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM loyalty_points l WHERE l.customerId = :customerId")
    List<LoyaltyPoint> findLockedByCustomerId(@Param("customerId") UUID customerId);
}
