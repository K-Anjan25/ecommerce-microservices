package com.ecommerce.commerce_service.dto.shippingRate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ShippingCalculationResponse {
    private BigDecimal cost;
    private String carrier;
    private int estimatedDaysMin;
    private int estimatedDaysMax;
    private boolean freeShipping;
    private String message;
}
