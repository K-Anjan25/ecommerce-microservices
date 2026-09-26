package com.ecommerce.commerce_service.dto.catalog;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Catalog pricing projection used to create authoritative order snapshots. */
@Data
@Builder
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

    public ProductSummaryDto(UUID id, String name, BigDecimal unitPrice, BigDecimal flashPrice,
            Boolean flashSaleActive, List<VariantSummaryDto> variants, CategorySummaryDto category) {
        this(id, name, unitPrice, flashPrice, flashSaleActive, variants, category, null, null, null);
    }

    public ProductSummaryDto(UUID id, String name, BigDecimal unitPrice, BigDecimal flashPrice,
            Boolean flashSaleActive, List<VariantSummaryDto> variants, CategorySummaryDto category,
            Boolean subscribeEligible, String imageUrl) {
        this(id, name, unitPrice, flashPrice, flashSaleActive, variants, category, subscribeEligible, imageUrl, null);
    }

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
