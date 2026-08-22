package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.shippingRate.ShippingCalculationRequest;
import com.ecommerce.commerce_service.dto.shippingRate.ShippingRateDto;
import com.ecommerce.commerce_service.service.ShippingRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/shipping")
public class ShippingRateController {

    private final ShippingRateService shippingRateService;

    @PostMapping("/calculate")
    public ResponseEntity<ShippingRateDto> calculateShipping(@Valid @RequestBody ShippingCalculationRequest request) {
        return ResponseEntity.ok(shippingRateService.calculateShipping(request));
    }

    @GetMapping("/rates")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ShippingRateDto>> getAllRates() {
        return ResponseEntity.ok(shippingRateService.getAllRates());
    }

    @PostMapping("/rates")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<ShippingRateDto> createRate(@Valid @RequestBody ShippingRateDto dto) {
        return new ResponseEntity<>(shippingRateService.createRate(dto), HttpStatus.CREATED);
    }

    @PutMapping("/rates/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<ShippingRateDto> updateRate(@PathVariable UUID id, @Valid @RequestBody ShippingRateDto dto) {
        return ResponseEntity.ok(shippingRateService.updateRate(id, dto));
    }

    @DeleteMapping("/rates/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteRate(@PathVariable UUID id) {
        shippingRateService.deleteRate(id);
        return ResponseEntity.noContent().build();
    }
}
