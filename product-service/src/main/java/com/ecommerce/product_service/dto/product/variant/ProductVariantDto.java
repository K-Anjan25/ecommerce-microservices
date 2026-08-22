package com.ecommerce.product_service.dto.product.variant;

import com.ecommerce.product_service.enumeration.Badge;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
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
}