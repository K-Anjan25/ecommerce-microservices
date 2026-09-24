package com.ecommerce.product_service.dto.product;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

/** Bulk move: reassign every product to {@code categoryId}. */
@Getter
@Setter
public class BulkCategoryMoveRequest {

    @NotEmpty
    @Size(max = 500)
    private List<java.util.UUID> ids;

    @NotNull
    private Long categoryId;
}
