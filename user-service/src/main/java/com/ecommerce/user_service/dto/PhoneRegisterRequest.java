package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * Second step of phone sign-up: the number proved ownership of a one-time
 * code (see PhoneOtpService.verify), so only the profile details are needed.
 * Email and password stay optional — the account can be phone-only.
 */
@Getter
public class PhoneRegisterRequest {

    /** E.164 phone with country code, e.g. +919876543210. */
    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must be 20 characters or fewer")
    private String phone;

    /** The 6-digit code the user was verified with. */
    @NotBlank(message = "Enter the 6-digit code from the SMS")
    @Size(max = 6, message = "Enter the 6-digit code from the SMS")
    private String code;

    @NotBlank(message = "First name is required")
    @Size(max = 40, message = "First name must be 40 characters or fewer")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 40, message = "Last name must be 40 characters or fewer")
    private String lastName;

    /** Optional — accounts can be phone-only. */
    private String email;

    /** Optional — phone sign-in works without a password. */
    private String password;

    public boolean hasEmail() {
        return email != null && !email.isBlank();
    }

    public boolean hasPassword() {
        return password != null && !password.isBlank();
    }
}
