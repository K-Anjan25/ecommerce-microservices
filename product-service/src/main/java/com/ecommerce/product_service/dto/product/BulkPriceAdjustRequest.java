package com.ecommerce.product_service.dto.product;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.List;

/** Bulk price adjustment in percent (-90 .. +100). */
@Getter
@Setter
public class BulkPriceAdjustRequest {

    @NotEmpty
    @Size(max = 500)
    private List<java.util.UUID> ids;

    @javax.validation.constraints.Min(-90)
    @javax.validation.constraints.Max(100)
    private double percent;
}
