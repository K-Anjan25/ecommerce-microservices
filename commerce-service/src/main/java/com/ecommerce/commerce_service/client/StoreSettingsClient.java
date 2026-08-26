package com.ecommerce.commerce_service.client;

import com.ecommerce.commerce_service.dto.store.StoreBrandDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Read-only store branding lookup against product-service for invoices and
 * customer emails. The endpoint is public-read; callers must still treat
 * failures as optional (branding never blocks invoicing).
 */
@FeignClient(
        name = "store-settings-client",
        url = "${product-service.url}",
        path = "/v1/store-settings"
)
public interface StoreSettingsClient {

    @GetMapping
    StoreBrandDto getBrand();
}
