package com.ecommerce.commerce_service.dto.subscription;

import lombok.Getter;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
public class CreateSubscriptionRequest {

    @NotNull
    private UUID productId;

    /** Variant (colourway/config) to subscribe; null for products without variants. */
    private UUID variantId;

    @NotNull
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 20, message = "Quantity cannot exceed 20 per delivery")
    private Integer quantity;

    /** Delivery cadence in days (Amazon presets: 14 / 30 / 60 / 90 / 180). */
    @NotNull
    @Min(value = 7, message = "Fastest subscription is every 7 days")
    @Max(value = 180, message = "Slowest subscription is every 180 days")
    private Integer intervalDays;
}
