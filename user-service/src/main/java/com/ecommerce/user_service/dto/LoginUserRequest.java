package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotNull;

@Getter
public class LoginUserRequest {
    @NotNull
    private String email;
    @NotNull
    private String password;
}