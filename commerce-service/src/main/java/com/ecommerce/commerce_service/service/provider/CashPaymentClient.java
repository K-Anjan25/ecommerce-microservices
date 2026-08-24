package com.ecommerce.commerce_service.service.provider;

import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CashPaymentClient implements PaymentProviderClient {

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.CASH;
    }

    @Override
    public ProviderPaymentResult charge(Payment payment) {
        log.info("Cash on delivery registered for order {}", payment.getOrderId());
        return ProviderPaymentResult.builder()
                .success(true)
                .transactionId("CASH-" + payment.getOrderId())
                .message("Cash on delivery selected; order stays pending until delivery")
                .build();
    }

    @Override
    public ProviderPaymentResult refund(Payment payment, java.math.BigDecimal amount) {
        log.info("COD refund recorded for order {} ({} {})", payment.getOrderId(), amount, payment.getCurrency());
        return ProviderPaymentResult.builder()
                .success(true)
                .transactionId("CASH-REFUND-" + payment.getOrderId())
                .message("Cash on delivery refund recorded; to be settled offline")
                .build();
    }

    @Override
    public ProviderPaymentResult cancel(Payment payment) {
        return ProviderPaymentResult.builder().success(true)
                .transactionId(payment.getTransactionId())
                .message("Cash on delivery cancelled before collection").build();
    }

}