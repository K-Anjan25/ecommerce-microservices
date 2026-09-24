package com.ecommerce.product_service.dto.product.variant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantDto {
    private UUID id;
    private String name;
    private String sku;
    private BigDecimal price;
    private Integer quantityInStock;
    private String attributes;
    /** Swatch chip colour for the variant selector, e.g. "#1c1c1c". */
    private String swatchHex;
    /** Primary shot of this variant; gallery swaps to variant images when selected. */
    private String imageUrl;
}
