package com.ecommerce.product_service.dto.product;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.List;

/** Bulk operation payload: the affected product ids. */
@Getter
@Setter
public class BulkProductRequest {

    @NotEmpty
    @Size(max = 500)
    private List<java.util.UUID> ids;
}
