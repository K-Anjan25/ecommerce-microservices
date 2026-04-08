package com.ecommerce.order_service.dto.orderAddress;

import lombok.*;

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