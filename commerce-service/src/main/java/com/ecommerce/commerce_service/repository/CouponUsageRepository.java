package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, UUID> {
    boolean existsByCouponIdAndUserId(UUID couponId, UUID userId);
    long countByCouponId(UUID couponId);
    void deleteByCouponId(UUID couponId);
    Optional<CouponUsage> findByOrderId(UUID orderId);
}
