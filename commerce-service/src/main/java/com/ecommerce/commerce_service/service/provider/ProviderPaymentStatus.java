package com.ecommerce.commerce_service.service.provider;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/** Provider-authenticated status snapshot used by the reconciliation worker. */
@Getter
@Builder
public class ProviderPaymentStatus {
    /** The provider returned a recognizable operation, not merely an HTTP response. */
    private boolean found;
    /** The provider reports captured/succeeded funds. */
    private boolean settled;
    /** The provider reports a terminal failed/cancelled operation. */
    private boolean failed;
    private String failureReason;
    private String transactionId;
    private BigDecimal amount;
    private String currency;
    private String message;

    public static ProviderPaymentStatus unknown(String message) {
        return ProviderPaymentStatus.builder().found(false).message(message).build();
    }
}
