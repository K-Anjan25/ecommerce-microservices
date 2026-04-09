package com.ecommerce.payment_service.service.provider;

import com.ecommerce.payment_service.entity.Payment;
import com.ecommerce.payment_service.model.PaymentProvider;

public interface PaymentProviderClient {
    PaymentProvider provider();
    ProviderPaymentResult charge(Payment payment);
}
