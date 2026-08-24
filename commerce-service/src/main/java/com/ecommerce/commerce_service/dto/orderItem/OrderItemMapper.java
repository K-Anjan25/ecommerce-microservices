package com.ecommerce.commerce_service.dto.orderItem;

import com.ecommerce.commerce_service.model.OrderItem;
import org.springframework.stereotype.Component;


@Component
public class OrderItemMapper {

    public OrderItemDto orderToOrderItemDto(OrderItem orderItem){
        return OrderItemDto.builder()
                .productId(orderItem.getProductId())
                .variantId(orderItem.getVariantId())
                .quantity(orderItem.getQuantity())
                .price(orderItem.getPrice())
                .build();
    }

    public OrderItem orderItemRequestToOrderItem(CreateOrderItemRequest createOrderItemRequest){
        return OrderItem.builder()
                .productId(createOrderItemRequest.getProductId())
                .variantId(createOrderItemRequest.getVariantId())
                .quantity(createOrderItemRequest.getQuantity())
                .build();
    }

}
