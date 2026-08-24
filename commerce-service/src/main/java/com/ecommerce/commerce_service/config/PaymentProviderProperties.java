package com.ecommerce.commerce_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.providers")
public class PaymentProviderProperties {
    private Stripe stripe = new Stripe();
    private Razorpay razorpay = new Razorpay();

    @Getter
    @Setter
    public static class Stripe {
        private String secretKey;
        private String webhookSecret;
    }

    @Getter
    @Setter
    public static class Razorpay {
        private String keyId;
        private String keySecret;
        private String webhookSecret;
    }
}
