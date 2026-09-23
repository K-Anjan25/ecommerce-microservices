package com.ecommerce.product_service.dto.category;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
@Setter
public class UpdateCategoryRequest {

    @NotBlank
    @Size(min = 1, max = 120)
    private String name;

    private String slug;
    private Long parentId;
    private Integer sortOrder;
}
