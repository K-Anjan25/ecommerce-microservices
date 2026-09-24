package com.ecommerce.commerce_service.dto.shippingRate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Quote for an international destination. When {@code available} is false the
 * destination is not serviceable yet and the remaining fields are defaults.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InternationalQuoteResponse {

    private String country;
    private boolean available;
    private String zoneName;
    private BigDecimal cost;
    private BigDecimal freeAbove;
    private int estimatedDaysMin;
    private int estimatedDaysMax;
    private String carrier;

    /** Import duty + VAT estimate for the given subtotal. */
    private BigDecimal dutyEstimate;
    private String dutyName;
    private BigDecimal dutyRate;
}
