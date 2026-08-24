package com.ecommerce.commerce_service.service.provider;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;

import java.math.BigDecimal;

public interface PaymentProviderClient {
    PaymentProvider provider();

    ProviderPaymentResult charge(Payment payment);

    /**
     * Refund (part of) a previous charge. Implementations without configured
     * keys return a clearly-marked simulated success so the admin return flow
     * stays testable in dev.
     */
    ProviderPaymentResult refund(Payment payment, BigDecimal amount);

    /**
     * Refund with a caller-owned stable operation key. Providers that support
     * idempotency should use it; the default preserves existing integrations.
     */
    default ProviderPaymentResult refund(Payment payment, BigDecimal amount, String idempotencyKey) {
        return refund(payment, amount);
    }

    /** Cancel an initiated but unsettled provider operation before releasing reservations. */
    ProviderPaymentResult cancel(Payment payment);

    /**
     * Reads provider-authenticated state for a pending operation. Implementations
     * must return an unknown status on a transient provider error so local
     * reservations remain pending rather than being released speculatively.
     */
    default ProviderPaymentStatus lookup(Payment payment) {
        return ProviderPaymentStatus.unknown("Provider status lookup is not supported");
    }
}
