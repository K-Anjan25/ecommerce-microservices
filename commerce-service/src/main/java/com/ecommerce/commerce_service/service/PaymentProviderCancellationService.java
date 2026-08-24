package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.service.provider.PaymentProviderClient;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentProviderCancellationService {
    private final List<PaymentProviderClient> clients;

    public ProviderPaymentResult cancel(Payment payment) {
        if (payment == null || payment.getProvider() == null) {
            throw new IllegalArgumentException("Payment provider is required for cancellation");
        }
        return clients.stream()
                .filter(client -> client.provider() == payment.getProvider())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unsupported payment provider: " + payment.getProvider()))
                .cancel(payment);
    }
}
