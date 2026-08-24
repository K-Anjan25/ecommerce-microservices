package com.ecommerce.commerce_service.dto.payment;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class PaymentResponse {
    private UUID orderId;
    private BigDecimal amount;
    private String currency;
    private String provider;
    private String status;
    private String transactionId;
    /** Browser-only provider token; never contains a server-side API secret. */
    private String clientSecret;
    private String message;
}
