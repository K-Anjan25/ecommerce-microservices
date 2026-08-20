package com.ecommerce.product_service.dto.product;


import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
public class CreateProductRequest {
    @NotNull
    private String name;
    @NotNull
    private BigDecimal unitPrice;
    @NotNull
    private Long categoryId;
    @NotNull
    private String description;
    @NotNull
    private Integer quantityInStock;
    @NotNull
    private String imageUrl;
}