package com.ecommerce.order_service.dto.order;

import com.ecommerce.order_service.dto.orderAddress.CreateOrderAddressRequest;
import com.ecommerce.order_service.dto.orderItem.CreateOrderItemRequest;
import lombok.Getter;

import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

@Getter
public class CreateOrderRequest {
    @NotNull
    private CreateOrderAddressRequest address;
    @NotNull
    private List<CreateOrderItemRequest> items;
}