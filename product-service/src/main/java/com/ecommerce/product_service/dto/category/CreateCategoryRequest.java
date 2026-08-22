package com.ecommerce.product_service.dto.category;

import lombok.Getter;

import javax.validation.constraints.NotNull;

@Getter
public class CreateCategoryRequest {
    @NotNull
    private String name;
    private String slug;
    private Long parentId;
    private Integer sortOrder;
}