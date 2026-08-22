package com.ecommerce.commerce_service.dto.coupon;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Admin coupon update. All fields optional (null = leave unchanged).
 * Code/type/value are immutable by design — deactivate and recreate instead.
 */
@Getter
@Setter
public class UpdateCouponRequest {
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Integer usageLimit;
    private Boolean active;
}
