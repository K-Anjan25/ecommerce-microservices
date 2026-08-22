package com.ecommerce.commerce_service.dto.shippingRate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ShippingRateDto {
    private UUID id;
    private String pincode;
    private BigDecimal cost;
    private BigDecimal freeAbove;
    private int estimatedDaysMin;
    private int estimatedDaysMax;
    private String carrier;
    private boolean active;
}
