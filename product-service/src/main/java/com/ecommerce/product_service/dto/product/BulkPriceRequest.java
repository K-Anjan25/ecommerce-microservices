package com.ecommerce.product_service.dto.product;

import lombok.Getter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
public class BulkPriceRequest {

    @NotEmpty
    private List<UUID> ids;

    /**
     * PERCENT: amount is a signed percentage (-20 = 20% off, 5 = +5%).
     * SET: every selected product's price becomes the amount.
     */
    @NotNull
    private String mode;

    @NotNull
    private BigDecimal amount;
}
