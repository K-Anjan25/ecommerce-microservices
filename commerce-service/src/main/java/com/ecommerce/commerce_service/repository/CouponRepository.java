package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import javax.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    Optional<Coupon> findByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM coupons c WHERE c.code = :code")
    Optional<Coupon> findLockedByCode(@Param("code") String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM coupons c WHERE c.id = :id")
    Optional<Coupon> findLockedById(@Param("id") UUID id);
}