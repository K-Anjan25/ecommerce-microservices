package com.ecommerce.commerce_service.dto.subscription;

import lombok.Getter;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;

@Getter
public class UpdateSubscriptionRequest {

    private Boolean active;

    @Min(value = 7, message = "Fastest subscription is every 7 days")
    @Max(value = 180, message = "Slowest subscription is every 180 days")
    private Integer intervalDays;

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 20, message = "Quantity cannot exceed 20 per delivery")
    private Integer quantity;
}
