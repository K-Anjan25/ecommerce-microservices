package com.ecommerce.user_service.dto;

import lombok.Getter;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
public class PasswordResetConfirmRequest {
    @NotBlank
    private String token;
    @NotBlank @Size(min = 8, max = 128)
    private String newPassword;
}
