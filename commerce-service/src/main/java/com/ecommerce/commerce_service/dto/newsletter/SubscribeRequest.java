package com.ecommerce.commerce_service.dto.newsletter;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
@Setter
public class SubscribeRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 255, message = "Email must be 255 characters or fewer")
    private String email;
}
