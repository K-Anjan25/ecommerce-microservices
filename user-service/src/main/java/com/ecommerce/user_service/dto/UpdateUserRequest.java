package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/** Customer-editable profile fields only. Roles and account flags are admin APIs. */
@Getter
public class UpdateUserRequest {
    @Email
    private String email; // displayed by the client; ownership comes from the token
    @NotBlank @Size(max = 80)
    private String firstName;
    @NotBlank @Size(max = 80)
    private String lastName;
    @Size(max = 500)
    private String profileImageURL;
}
