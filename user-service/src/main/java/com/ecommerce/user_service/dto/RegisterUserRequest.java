package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.regex.Pattern;

@Getter
public class RegisterUserRequest {
    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{6,14}$");

    @NotNull
    private String email;
    @NotNull
    private String firstName;
    @NotNull
    private String lastName;
    @NotNull
    private String password;
    private String referralCode;

    /** Optional E.164 phone with country code, e.g. +919876543210. */
    @Size(max = 20, message = "Phone number must be 20 characters or fewer")
    private String phoneNumber;

    public boolean hasPhoneNumber() {
        return phoneNumber != null && !phoneNumber.isBlank();
    }

    public void validatePhoneNumber() {
        if (hasPhoneNumber() && !E164.matcher(phoneNumber.trim()).matches()) {
            throw new IllegalArgumentException(
                    "Phone must include the country code, e.g. +919876543210");
        }
    }
}


