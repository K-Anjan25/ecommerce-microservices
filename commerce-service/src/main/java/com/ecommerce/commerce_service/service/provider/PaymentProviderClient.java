package com.ecommerce.commerce_service.service.provider;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;

public interface PaymentProviderClient {
    PaymentProvider provider();
    ProviderPaymentResult charge(Payment payment);
}
