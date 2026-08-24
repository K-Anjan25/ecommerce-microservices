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

    /** Cancel an initiated but unsettled provider operation before releasing reservations. */
    ProviderPaymentResult cancel(Payment payment);
}
