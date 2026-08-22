package com.ecommerce.commerce_service.dto.orderItem;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemRequest {
    @NotNull
    private UUID productId;
    private UUID variantId;
    @NotNull
    private Integer quantity;
    @NotNull
    private BigDecimal price;
}
