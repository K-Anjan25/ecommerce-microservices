package com.ecommerce.commerce_service.dto.order;

import com.ecommerce.commerce_service.dto.orderAddress.CreateOrderAddressRequest;
import com.ecommerce.commerce_service.dto.orderItem.CreateOrderItemRequest;
import lombok.Getter;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
public class CreateOrderRequest {
    @NotNull
    private CreateOrderAddressRequest address;
    @NotNull
    private List<CreateOrderItemRequest> items;
    private String couponCode;
    private String customerEmail;
}
