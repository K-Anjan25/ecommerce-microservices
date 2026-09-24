package com.ecommerce.product_service.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Gallery image with variant/angle metadata. Plain URL strings still map (angle=gallery). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageDto {
    private UUID id;
    private String url;
    private Integer sortOrder;
    /** Null for product-level shots. */
    private UUID variantId;
    /** front | side | back | detail | box | lifestyle | gallery */
    private String angle;
    private String altText;
}
