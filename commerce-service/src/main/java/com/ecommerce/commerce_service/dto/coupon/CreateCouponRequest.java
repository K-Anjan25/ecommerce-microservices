package com.ecommerce.commerce_service.dto.coupon;

import com.ecommerce.commerce_service.model.CouponType;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Future;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreateCouponRequest {

    @NotBlank
    private String code;

    @NotNull
    private CouponType type;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal value;

    @DecimalMin(value = "0.0")
    private BigDecimal minOrderAmount;

    @DecimalMin(value = "0.0")
    private BigDecimal maxDiscount;

    private LocalDateTime validFrom;

    @Future
    private LocalDateTime validUntil;

    private Integer usageLimit;
}