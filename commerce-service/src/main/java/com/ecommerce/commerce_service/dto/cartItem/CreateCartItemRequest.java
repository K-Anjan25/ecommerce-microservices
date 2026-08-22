package com.ecommerce.commerce_service.dto.cartItem;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
public class CreateCartItemRequest {
    private UUID productId;
    private UUID variantId;
    private String name;
    private BigDecimal price;
    private Integer quantity;
}
