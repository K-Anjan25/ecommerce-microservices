package com.ecommerce.commerce_service.dto.subscription;

import lombok.Getter;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.time.LocalDateTime;

/** Owner (or staff) edit: pause/resume, cadence, quantity, pause window, OOS policy. */
@Getter
public class UpdateSubscriptionRequest {

    /** Resume (true) / pause (false). Resume resets the delivery clock from now. */
    private Boolean active;

    @Min(value = 7, message = "Fastest subscription is every 7 days")
    @Max(value = 180, message = "Slowest subscription is every 180 days")
    private Integer intervalDays;

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 20, message = "Quantity cannot exceed 20 per delivery")
    private Integer quantity;

    /** Pause deliveries until this date (naive business-local wall clock). */
    private LocalDateTime pauseUntil;

    /** SKIP | WAIT | CANCEL — what to do when the item is out of stock. */
    private String oosPolicy;
}
