package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotNull;

@Getter
public class RegisterUserRequest {
    @NotNull
    private String email;
    @NotNull
    private String firstName;
    @NotNull
    private String lastName;
    @NotNull
    private String password;
}


