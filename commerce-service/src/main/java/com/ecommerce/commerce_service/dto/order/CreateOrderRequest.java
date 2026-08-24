package com.ecommerce.commerce_service.dto.order;

import com.ecommerce.commerce_service.dto.orderAddress.CreateOrderAddressRequest;
import com.ecommerce.commerce_service.dto.orderItem.CreateOrderItemRequest;
import com.ecommerce.commerce_service.model.ShippingMethod;
import lombok.Getter;

import javax.validation.constraints.Min;
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
    private ShippingMethod shippingMethod;
    private Boolean giftWrap;
    private String pincode;
    private String state;
    private String giftCardCode;
    @Min(value = 0, message = "Loyalty points cannot be negative")
    private Integer loyaltyPoints;
}
