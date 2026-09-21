package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
public class PhoneOtpRequest {

    /** E.164 phone with country code, e.g. +919876543210. */
    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must be 20 characters or fewer")
    private String phone;
}
