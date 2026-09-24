package com.ecommerce.user_service.dto;

import com.ecommerce.user_service.enumeration.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String role;

    /** MFA step-up only: echoed verification code in dev/preview (no SMTP). */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private String devCode;
}