package com.ecommerce.commerce_service.dto.store;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Only the branding slice of product-service's StoreSettingsDto that invoices
 * need. Field names match the upstream DTO so Jackson maps it directly.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreBrandDto {
    private String storeName;
    private String storeTagline;
    private String supportEmail;
    private String invoiceFooterNote;
}
