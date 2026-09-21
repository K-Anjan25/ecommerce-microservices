package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
public class PhoneOtpVerifyRequest {

    /** E.164 phone with country code, e.g. +919876543210. */
    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must be 20 characters or fewer")
    private String phone;

    @NotBlank(message = "Enter the 6-digit code from the SMS")
    @Size(max = 6, message = "Enter the 6-digit code from the SMS")
    private String code;
}
