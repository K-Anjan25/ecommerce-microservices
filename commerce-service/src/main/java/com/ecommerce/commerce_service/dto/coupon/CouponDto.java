package com.ecommerce.commerce_service.dto.coupon;

import com.ecommerce.commerce_service.model.CouponType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponDto {
    private UUID id;
    private String code;
    private CouponType type;
    private BigDecimal value;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Integer usageLimit;
    private Integer usedCount;
    private boolean active;
}