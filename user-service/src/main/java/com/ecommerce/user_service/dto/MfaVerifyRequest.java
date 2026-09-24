package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotBlank;

@Getter
public class MfaVerifyRequest {

    @NotBlank
    private String email;

    @NotBlank
    private String code;
}
