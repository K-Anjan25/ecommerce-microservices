package com.ecommerce.commerce_service.dto.subscription;

import lombok.Getter;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/** Move the next delivery to a new date (naive business-local wall clock). */
@Getter
public class RescheduleSubscriptionRequest {

    @NotNull
    private LocalDateTime nextDeliveryDate;
}
