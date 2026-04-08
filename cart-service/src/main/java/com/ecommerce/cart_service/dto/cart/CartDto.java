package com.ecommerce.cart_service.dto.cart;

import com.ecommerce.cart_service.dto.cartItem.CartItemDto;
import com.ecommerce.cart_service.model.CartItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CartDto {
    private UUID customerId;
    private List<CartItemDto> cartItems;
    private BigDecimal totalPrice;
}