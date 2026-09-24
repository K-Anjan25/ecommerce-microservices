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
    /** Present in product-service responses; used for dashboard analytics. */
    private CategorySummaryDto category;
    private Boolean subscribeEligible;
    private String imageUrl;
    /** Cartly Plus member-only deal percent (server-side pricing). */
    private BigDecimal memberDealPercent;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySummaryDto {
        private Long id;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantSummaryDto {
        private UUID id;
        private String name;
        private BigDecimal price;
        private Integer quantityInStock;
        private String swatchHex;
        private String imageUrl;
    }
}
