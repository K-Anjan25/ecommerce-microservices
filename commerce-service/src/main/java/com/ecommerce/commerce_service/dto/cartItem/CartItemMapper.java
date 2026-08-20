package com.ecommerce.commerce_service.dto.cartItem;

import com.ecommerce.commerce_service.model.CartItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class CartItemMapper {
    public CartItem createCartItemRequestToCartItem(CreateCartItemRequest createCartItemRequest){
        int quantity = createCartItemRequest.getQuantity();
        BigDecimal price = createCartItemRequest.getPrice();
        return CartItem.builder()
                .name(createCartItemRequest.getName())
                .price(price)
                .productId(createCartItemRequest.getProductId())
                .quantity(quantity)
                .totalPrice(price.multiply(BigDecimal.valueOf(quantity)))
                .build();
    }

}
