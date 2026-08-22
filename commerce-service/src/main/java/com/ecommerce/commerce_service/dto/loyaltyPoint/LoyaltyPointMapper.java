package com.ecommerce.commerce_service.dto.loyaltyPoint;

import com.ecommerce.commerce_service.model.LoyaltyPoint;
import com.ecommerce.commerce_service.model.LoyaltyPointType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class LoyaltyPointMapper {

    public LoyaltyPointDto loyaltyPointToLoyaltyPointDto(LoyaltyPoint loyaltyPoint) {
        return LoyaltyPointDto.builder()
                .id(loyaltyPoint.getId())
                .customerId(loyaltyPoint.getCustomerId())
                .points(loyaltyPoint.getPoints())
                .description(loyaltyPoint.getDescription())
                .type(loyaltyPoint.getType())
                .amount(loyaltyPoint.getAmount())
                .createdDate(loyaltyPoint.getCreatedDate())
                .build();
    }
}
