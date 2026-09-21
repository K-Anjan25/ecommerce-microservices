package com.ecommerce.commerce_service.dto.savedAddress;

import lombok.Getter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
public class CreateSavedAddressRequest {
    @NotBlank
    private String state;
    @NotBlank
    private String district;
    @NotBlank
    private String addressDetail;

    /** ISO-3166 alpha-2; blank means India (the storefront's home market). */
    @Size(max = 2, message = "country must be a 2-letter ISO code")
    private String country;

    @Size(max = 20, message = "pincode must be 20 characters or fewer")
    private String pincode;

    @Size(max = 20, message = "phone number must be 20 characters or fewer")
    private String phoneNumber;

    private boolean defaultAddress;
}
