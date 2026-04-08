package com.ecommerce.cart_service.dto.cartItem;

import com.ecommerce.cart_service.model.CartItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CartItemMapper {
    public CartItem createCartItemRequestToCartItem(CreateCartItemRequest createCartItemRequest){
        return CartItem.builder()
                .name(createCartItemRequest.getName())
                .price(createCartItemRequest.getPrice())
                .productId(createCartItemRequest.getProductId())
                .quantity(createCartItemRequest.getQuantity())
                .build();
    }

}