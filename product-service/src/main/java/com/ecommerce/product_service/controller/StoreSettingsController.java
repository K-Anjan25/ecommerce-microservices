package com.ecommerce.product_service.controller;

import com.ecommerce.product_service.audit.AuditLogService;
import com.ecommerce.product_service.dto.store.StoreSettingsDto;
import com.ecommerce.product_service.service.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/store-settings")
public class StoreSettingsController {
    private final StoreSettingsService service;
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<StoreSettingsDto> get() {
        return ResponseEntity.ok(service.get());
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<StoreSettingsDto> update(@Valid @RequestBody StoreSettingsDto request) {
        StoreSettingsDto updated = service.update(request);
        auditLogService.record("STOREFRONT_SETTINGS_UPDATED", "STORE_SETTINGS", "1", request.getHeroTitle());
        return ResponseEntity.ok(updated);
    }
}
