package com.ecommerce.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Response for /user/otp/request. */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhoneOtpSentResponse {

    private boolean sent;

    /** Seconds until the code expires. */
    private long expiresInSeconds;

    /** The code itself — only present when no SMS provider is configured. */
    private String devCode;
}
