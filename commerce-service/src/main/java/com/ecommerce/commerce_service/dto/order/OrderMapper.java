package com.ecommerce.commerce_service.dto.order;

import com.ecommerce.commerce_service.dto.orderAddress.OrderAddressMapper;
import com.ecommerce.commerce_service.dto.orderItem.OrderItemMapper;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.model.ShippingMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderMapper {

    private final OrderAddressMapper orderAddressMapper;
    private final OrderItemMapper orderItemMapper;

    public OrderDto orderToOrderDto(Order order){
        return OrderDto.builder()
                .id(order.getId())
                .customerId(order.getCustomerId())
                .orderStatus(order.getOrderStatus())
                .address(orderAddressMapper.orderAddressToOrderAddressDto(order.getAddress()))
                .items(order.getItems()
                        .stream()
                        .map(orderItemMapper::orderToOrderItemDto)
                        .collect(Collectors.toList()))
                .createdDate(order.getCreatedDate())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingAmount(order.getShippingAmount())
                .taxAmount(order.getTaxAmount())
                .shippingMethod(order.getShippingMethod())
                .couponCode(order.getCouponCode())
                .customerEmail(order.getCustomerEmail())
                .giftWrap(order.getGiftWrap())
                .giftWrapFee(order.getGiftWrapFee())
                .loyaltyPointsRedeemed(order.getLoyaltyPointsRedeemed())
                .loyaltyDiscountAmount(order.getLoyaltyDiscountAmount())
                .giftCardCodeLast4(order.getGiftCardCodeLast4())
                .giftCardAmount(order.getGiftCardAmount())
                .build();
    }

    public Order orderRequestToOrder(CreateOrderRequest createOrderRequest){
        UUID customerId = null;
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof String) {
                customerId = UUID.fromString((String) principal);
            }
        } catch (Exception ignored) {
        }
        return Order.builder()
                .customerId(customerId)
                .orderStatus(OrderStatus.PENDING)
                .shippingMethod(createOrderRequest.getShippingMethod())
                .address(orderAddressMapper.orderAddressRequestToOrderAddress(createOrderRequest.getAddress()))
                .items(createOrderRequest.getItems()
                        .stream()
                        .map(orderItemMapper::orderItemRequestToOrderItem)
                        .collect(Collectors.toList()))
                .couponCode(createOrderRequest.getCouponCode())
                .customerEmail(createOrderRequest.getCustomerEmail())
                .giftWrap(createOrderRequest.getGiftWrap())
                .build();
    }

}
