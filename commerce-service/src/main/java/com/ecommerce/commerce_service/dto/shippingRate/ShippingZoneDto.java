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
@Builder
public class ShippingZoneDto {
    private UUID id;
    private String name;

    /** Comma-separated ISO-3166 alpha-2 codes. */
    private String countries;

    private BigDecimal cost;
    private BigDecimal freeAbove;
    private int estimatedDaysMin;
    private int estimatedDaysMax;
    private String carrier;

    /** Import duty + VAT rate applied to the taxable amount, e.g. 0.15. */
    private BigDecimal dutyRate;
    private String dutyName;
    private boolean active;
}
