package com.ecommerce.payment_service.service.provider;

import com.ecommerce.payment_service.config.PaymentProviderProperties;
import com.ecommerce.payment_service.entity.Payment;
import com.ecommerce.payment_service.model.PaymentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class StripePaymentClient implements PaymentProviderClient {

    private static final String STRIPE_PAYMENT_INTENT_URL = "https://api.stripe.com/v1/payment_intents";
    private final RestTemplate restTemplate;
    private final PaymentProviderProperties paymentProviderProperties;

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.STRIPE;
    }

    @Override
    public ProviderPaymentResult charge(Payment payment) {
        String secretKey = paymentProviderProperties.getStripe().getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("Stripe secret key is missing")
                    .build();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(secretKey));

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("amount", payment.getAmount().movePointRight(2).toPlainString());
            body.add("currency", payment.getCurrency().toLowerCase());
            body.add("confirm", "true");
            body.add("payment_method", "pm_card_visa");

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(STRIPE_PAYMENT_INTENT_URL, requestEntity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            String paymentIntentId = responseBody != null ? String.valueOf(responseBody.get("id")) : null;

            return ProviderPaymentResult.builder()
                    .success(response.getStatusCode().is2xxSuccessful() && paymentIntentId != null)
                    .transactionId(paymentIntentId)
                    .message(response.getStatusCode().is2xxSuccessful() ? "Stripe charge created" : "Stripe charge failed")
                    .build();
        } catch (Exception exception) {
            log.error("Stripe payment failed for orderId {}", payment.getOrderId(), exception);
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("Stripe error: " + exception.getMessage())
                    .build();
        }
    }

    private String basicAuth(String secretKey) {
        String token = secretKey + ":";
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }
}
