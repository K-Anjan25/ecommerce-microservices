package com.ecommerce.product_service.dto.product;

import com.ecommerce.product_service.dto.product.variant.ProductVariantDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProductRequest {
    @NotNull
    private String name;
    @NotNull
    private BigDecimal unitPrice;
    @NotNull
    private Long categoryId;
    @NotNull
    private String description;
    private Integer quantityInStock;
    private String imageUrl;
    private List<String> images;
    private List<ProductVariantDto> variants;
    private String brand;
    private BigDecimal originalPrice;
    private String badge;
    private Boolean featured;
}