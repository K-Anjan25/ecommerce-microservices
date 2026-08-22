package com.ecommerce.commerce_service.dto.loyaltyPoint;

import com.ecommerce.commerce_service.model.LoyaltyPointType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoyaltyPointDto {
    private UUID id;
    private UUID customerId;
    private Integer points;
    private String description;
    private LoyaltyPointType type;
    private BigDecimal amount;
    private LocalDateTime createdDate;
}
