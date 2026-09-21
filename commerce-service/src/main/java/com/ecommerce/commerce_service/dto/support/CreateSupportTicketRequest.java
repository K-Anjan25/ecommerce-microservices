package com.ecommerce.commerce_service.dto.support;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
@Setter
public class CreateSupportTicketRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must be 120 characters or fewer")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 180, message = "Email must be 180 characters or fewer")
    private String email;

    @NotBlank(message = "Choose a topic")
    @Size(max = 60)
    private String topic;

    @Size(max = 64, message = "Order number must be 64 characters or fewer")
    private String orderNumber;

    @NotBlank(message = "Tell us what happened")
    @Size(min = 20, max = 4000, message = "Please describe the issue in at least 20 characters (max 4000)")
    private String message;
}
