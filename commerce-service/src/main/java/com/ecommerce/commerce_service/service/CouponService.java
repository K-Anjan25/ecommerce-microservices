package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.coupon.CouponDto;
import com.ecommerce.commerce_service.dto.coupon.CouponValidationRequest;
import com.ecommerce.commerce_service.dto.coupon.CouponValidationResponse;
import com.ecommerce.commerce_service.dto.coupon.CreateCouponRequest;
import com.ecommerce.commerce_service.exception.CouponException;
import com.ecommerce.commerce_service.model.Coupon;
import com.ecommerce.commerce_service.model.CouponType;
import com.ecommerce.commerce_service.model.CouponUsage;
import com.ecommerce.commerce_service.repository.CouponRepository;
import com.ecommerce.commerce_service.repository.CouponUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    @Transactional
    public CouponDto createCoupon(CreateCouponRequest request) {
        if (couponRepository.findByCode(request.getCode().trim().toUpperCase()).isPresent()) {
            throw new CouponException("Coupon code already exists: " + request.getCode());
        }
        Coupon coupon = Coupon.builder()
                .code(request.getCode().trim().toUpperCase())
                .type(request.getType())
                .value(request.getValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscount(request.getMaxDiscount())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .active(true)
                .build();
        return toDto(couponRepository.save(coupon));
    }

    public CouponValidationResponse validateCoupon(CouponValidationRequest request, UUID userId) {
        Coupon coupon = findValidCoupon(request.getCode(), request.getOrderAmount(), userId);
        BigDecimal discount = computeDiscount(coupon, request.getOrderAmount());
        return CouponValidationResponse.builder()
                .valid(true)
                .code(coupon.getCode())
                .discountAmount(discount)
                .totalAfterDiscount(request.getOrderAmount().subtract(discount))
                .message("Coupon is valid")
                .build();
    }

    @Transactional
    public void markUsed(String code, UUID userId, UUID orderId) {
        Coupon coupon = couponRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new CouponException("Coupon not found: " + code));
        if (!coupon.isActive()) {
            throw new CouponException("Coupon is inactive: " + code);
        }
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
        couponUsageRepository.save(CouponUsage.builder()
                .coupon(coupon)
                .userId(userId)
                .orderId(orderId)
                .usedAt(LocalDateTime.now())
                .build());
        log.info("Coupon {} used by user {} on order {}", coupon.getCode(), userId, orderId);
    }

    public BigDecimal computeDiscount(Coupon coupon, BigDecimal orderAmount) {
        BigDecimal discount;
        if (coupon.getType() == CouponType.PERCENT) {
            discount = orderAmount.multiply(coupon.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else {
            discount = coupon.getValue().min(orderAmount);
        }
        return discount;
    }

    public Coupon findCoupon(String code) {
        return couponRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new CouponException("Coupon not found: " + code));
    }

    private Coupon findValidCoupon(String code, BigDecimal orderAmount, UUID userId) {
        Coupon coupon = couponRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new CouponException("Coupon not found: " + code));
        if (!coupon.isActive()) {
            throw new CouponException("Coupon is inactive: " + coupon.getCode());
        }
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            throw new CouponException("Coupon is not valid yet: " + coupon.getCode());
        }
        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            throw new CouponException("Coupon has expired: " + coupon.getCode());
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new CouponException("Coupon usage limit reached: " + coupon.getCode());
        }
        if (couponUsageRepository.existsByCouponIdAndUserId(coupon.getId(), userId)) {
            throw new CouponException("Coupon already used by this user: " + coupon.getCode());
        }
        if (coupon.getMinOrderAmount() != null && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new CouponException("Minimum order amount " + coupon.getMinOrderAmount() + " not met");
        }
        return coupon;
    }

    private CouponDto toDto(Coupon coupon) {
        return CouponDto.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .type(coupon.getType())
                .value(coupon.getValue())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxDiscount(coupon.getMaxDiscount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .active(coupon.isActive())
                .build();
    }
}