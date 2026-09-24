package com.ecommerce.user_service.dto;

import lombok.Getter;

import javax.validation.constraints.NotNull;

@Getter
public class MfaToggleRequest {

    @NotNull
    private Boolean enabled;
}
