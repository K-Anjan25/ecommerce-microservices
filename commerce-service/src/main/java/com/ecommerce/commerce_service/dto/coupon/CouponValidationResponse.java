package com.ecommerce.commerce_service.dto.coupon;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationResponse {
    private boolean valid;
    private String code;
    private BigDecimal discountAmount;
    private BigDecimal totalAfterDiscount;
    private String message;
}