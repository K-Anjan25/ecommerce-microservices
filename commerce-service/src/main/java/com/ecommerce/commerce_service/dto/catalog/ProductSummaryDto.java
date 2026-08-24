package com.ecommerce.commerce_service.dto.catalog;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Catalog pricing projection used to create authoritative order snapshots. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryDto {
    private UUID id;
    private String name;
    private BigDecimal unitPrice;
    private BigDecimal flashPrice;
    private Boolean flashSaleActive;
    private List<VariantSummaryDto> variants;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantSummaryDto {
        private UUID id;
        private BigDecimal price;
        private Integer quantityInStock;
    }
}
