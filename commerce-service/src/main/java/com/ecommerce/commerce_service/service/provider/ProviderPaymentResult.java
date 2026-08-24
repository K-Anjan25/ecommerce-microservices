package com.ecommerce.commerce_service.service.provider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ProviderPaymentResult {
    /** Provider accepted the operation request. */
    private boolean success;
    /** Funds are captured/succeeded, not merely initiated. */
    private boolean settled;
    private String transactionId;
    private String message;
}
