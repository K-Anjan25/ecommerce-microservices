package com.ecommerce.cart_service.dto.cartItem;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.util.UUID;

@Getter
public class UpdateCartItemRequest {
    private UUID productId;
    private Integer quantity;
}