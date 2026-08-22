package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.taxRule.TaxRuleDto;
import com.ecommerce.commerce_service.dto.taxRule.TaxRuleMapper;
import com.ecommerce.commerce_service.model.TaxRule;
import com.ecommerce.commerce_service.repository.TaxRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxRuleService {

    private final TaxRuleRepository taxRuleRepository;
    private final TaxRuleMapper taxRuleMapper;

    public Optional<TaxRuleDto> getTaxRuleForState(String state) {
        return taxRuleRepository.findByStateAndActiveTrue(state)
                .map(taxRuleMapper::toDto);
    }

    public List<TaxRuleDto> getAllRules() {
        return taxRuleRepository.findAll()
                .stream()
                .map(taxRuleMapper::toDto)
                .toList();
    }

    public TaxRuleDto createRule(TaxRuleDto dto) {
        TaxRule rule = TaxRule.builder()
                .state(dto.getState())
                .rate(dto.getRate())
                .taxName(dto.getTaxName())
                .code(dto.getCode())
                .active(dto.isActive())
                .build();
        TaxRule saved = taxRuleRepository.save(rule);
        return taxRuleMapper.toDto(saved);
    }

    public TaxRuleDto updateRule(UUID id, TaxRuleDto dto) {
        TaxRule rule = taxRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tax rule not found"));
        rule.setState(dto.getState());
        rule.setRate(dto.getRate());
        rule.setTaxName(dto.getTaxName());
        rule.setCode(dto.getCode());
        rule.setActive(dto.isActive());
        TaxRule saved = taxRuleRepository.save(rule);
        return taxRuleMapper.toDto(saved);
    }

    public void deleteRule(UUID id) {
        taxRuleRepository.deleteById(id);
    }
}
