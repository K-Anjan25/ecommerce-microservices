package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.taxRule.TaxRuleDto;
import com.ecommerce.commerce_service.service.TaxRuleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/tax")
public class TaxRuleController {

    private final TaxRuleService taxRuleService;

    @GetMapping("/rule/{state}")
    public ResponseEntity<TaxRuleDto> getTaxRuleForState(@PathVariable String state) {
        return taxRuleService.getTaxRuleForState(state)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/rules")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<TaxRuleDto>> getAllRules() {
        return ResponseEntity.ok(taxRuleService.getAllRules());
    }

    @PostMapping("/rules")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<TaxRuleDto> createRule(@Valid @RequestBody TaxRuleDto dto) {
        return new ResponseEntity<>(taxRuleService.createRule(dto), HttpStatus.CREATED);
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<TaxRuleDto> updateRule(@PathVariable UUID id, @Valid @RequestBody TaxRuleDto dto) {
        return ResponseEntity.ok(taxRuleService.updateRule(id, dto));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteRule(@PathVariable UUID id) {
        taxRuleService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }
}
