package com.ecommerce.commerce_service.dto.order;

import com.ecommerce.commerce_service.dto.orderAddress.OrderAddressDto;
import com.ecommerce.commerce_service.dto.orderItem.OrderItemDto;
import com.ecommerce.commerce_service.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderDto {
    private UUID id;
    private UUID customerId;
    private OrderAddressDto address;
    private List<OrderItemDto> items;
    private OrderStatus orderStatus;
    private LocalDateTime createdDate;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private String couponCode;
    private String customerEmail;
}
