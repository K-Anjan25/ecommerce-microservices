package com.ecommerce.commerce_service.dto.savedAddress;

import lombok.Getter;

import javax.validation.constraints.NotBlank;

@Getter
public class CreateSavedAddressRequest {
    @NotBlank
    private String state;
    @NotBlank
    private String district;
    @NotBlank
    private String addressDetail;
    private boolean defaultAddress;
}
