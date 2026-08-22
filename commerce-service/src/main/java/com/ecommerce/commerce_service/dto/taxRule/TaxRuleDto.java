package com.ecommerce.commerce_service.dto.taxRule;

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
public class TaxRuleDto {
    private UUID id;
    private String state;
    private BigDecimal rate;
    private String taxName;
    private String code;
    private boolean active;
}
