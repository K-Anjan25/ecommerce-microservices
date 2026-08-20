package com.ecommerce.commerce_service.dto.coupon;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationRequest {

    @NotBlank
    private String code;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal orderAmount;
}