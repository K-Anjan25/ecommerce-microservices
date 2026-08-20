package com.ecommerce.commerce_service.dto.orderAddress;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;


@AllArgsConstructor
@NoArgsConstructor
@Getter
public class CreateOrderAddressRequest {
    @NotNull
    private String state;
    @NotNull
    private String district;
    @NotNull
    private String addressDetail;
}
