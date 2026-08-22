package com.ecommerce.commerce_service.dto.taxRule;

import com.ecommerce.commerce_service.model.TaxRule;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TaxRuleMapper {

    public TaxRuleDto toDto(TaxRule rule) {
        return TaxRuleDto.builder()
                .id(rule.getId())
                .state(rule.getState())
                .rate(rule.getRate())
                .taxName(rule.getTaxName())
                .code(rule.getCode())
                .active(rule.isActive())
                .build();
    }
}
