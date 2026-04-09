package com.ecommerce.payment_service.service.provider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ProviderPaymentResult {
    private boolean success;
    private String transactionId;
    private String message;
}
