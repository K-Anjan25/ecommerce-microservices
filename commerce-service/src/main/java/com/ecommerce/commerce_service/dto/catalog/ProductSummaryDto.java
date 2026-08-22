package com.ecommerce.commerce_service.dto.catalog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Minimal product projection (id + name) used for invoice line labels.
 * Extra fields in the product-service response are ignored on deserialization.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryDto {
    private UUID id;
    private String name;
}
