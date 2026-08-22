package com.ecommerce.commerce_service.dto.shippingRate;

import com.ecommerce.commerce_service.model.ShippingRate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class ShippingRateMapper {

    public ShippingRateDto toDto(ShippingRate rate) {
        return ShippingRateDto.builder()
                .id(rate.getId())
                .pincode(rate.getPincode())
                .cost(rate.getCost())
                .freeAbove(rate.getFreeAbove())
                .estimatedDaysMin(rate.getEstimatedDaysMin())
                .estimatedDaysMax(rate.getEstimatedDaysMax())
                .carrier(rate.getCarrier())
                .active(rate.isActive())
                .build();
    }
}
