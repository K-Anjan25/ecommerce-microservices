package com.ecommerce.payment_service.dto;

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
    private String message;
}
