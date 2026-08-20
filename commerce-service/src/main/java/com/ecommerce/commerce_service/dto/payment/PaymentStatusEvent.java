package com.ecommerce.commerce_service.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusEvent {
    private UUID orderId;
    private String status;
    private String provider;
    private String transactionId;
    private BigDecimal amount;
    private String currency;
}
