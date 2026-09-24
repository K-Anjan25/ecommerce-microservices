package com.ecommerce.product_service.dto.product;

import lombok.Getter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

@Getter
public class BulkCategoryRequest {

    @NotEmpty
    private List<UUID> ids;

    /** Target category all selected products are moved into. */
    @NotNull
    private Long categoryId;
}
