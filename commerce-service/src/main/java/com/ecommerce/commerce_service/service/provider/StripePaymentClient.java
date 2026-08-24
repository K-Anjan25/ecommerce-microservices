package com.ecommerce.commerce_service.service.provider;

import com.ecommerce.commerce_service.config.PaymentProviderProperties;
import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
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
            headers.set("Idempotency-Key", "cartly-order-" + payment.getOrderId());

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("amount", payment.getAmount().movePointRight(2).toPlainString());
            body.add("currency", payment.getCurrency().toLowerCase());
            body.add("confirm", "true");
            body.add("payment_method", "pm_card_visa");

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(STRIPE_PAYMENT_INTENT_URL, requestEntity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            String paymentIntentId = responseBody != null ? String.valueOf(responseBody.get("id")) : null;
            String intentStatus = responseBody != null ? String.valueOf(responseBody.get("status")) : null;
            boolean initiated = response.getStatusCode().is2xxSuccessful() && paymentIntentId != null;
            boolean settled = initiated && "succeeded".equalsIgnoreCase(intentStatus);

            return ProviderPaymentResult.builder()
                    .success(initiated)
                    .settled(settled)
                    .transactionId(paymentIntentId)
                    .message(settled ? "Stripe payment succeeded" : initiated
                            ? "Stripe payment requires provider confirmation" : "Stripe charge failed")
                    .build();
        } catch (Exception exception) {
            log.error("Stripe payment failed for orderId {}", payment.getOrderId(), exception);
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("Stripe error: " + exception.getMessage())
                    .build();
        }
    }

    @Override
    public ProviderPaymentResult refund(Payment payment, java.math.BigDecimal amount) {
        String secretKey = paymentProviderProperties.getStripe().getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            return ProviderPaymentResult.builder()
                    .success(true)
                    .transactionId("SIM-REFUND-" + payment.getOrderId())
                    .message("Stripe secret key is missing - refund simulated")
                    .build();
        }
        String transactionId = payment.getTransactionId();
        if (transactionId == null || transactionId.isBlank()) {
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("No Stripe transaction stored for order " + payment.getOrderId())
                    .build();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(secretKey));

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("payment_intent", transactionId);
            body.add("amount", amount.movePointRight(2).toPlainString()); // smallest currency unit

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity("https://api.stripe.com/v1/refunds", requestEntity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            String refundId = responseBody != null ? String.valueOf(responseBody.get("id")) : null;

            return ProviderPaymentResult.builder()
                    .success(response.getStatusCode().is2xxSuccessful() && refundId != null)
                    .transactionId(refundId)
                    .message(response.getStatusCode().is2xxSuccessful() ? "Stripe refund created" : "Stripe refund failed")
                    .build();
        } catch (Exception exception) {
            log.error("Stripe refund failed for orderId {}", payment.getOrderId(), exception);
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("Stripe refund error: " + exception.getMessage())
                    .build();
        }
    }

    @Override
    public ProviderPaymentResult cancel(Payment payment) {
        String secretKey = paymentProviderProperties.getStripe().getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            return ProviderPaymentResult.builder().success(false)
                    .message("Stripe secret key is missing; payment intent was not cancelled").build();
        }
        if (payment.getTransactionId() == null || payment.getTransactionId().isBlank()) {
            return ProviderPaymentResult.builder().success(false)
                    .message("Stripe payment intent reference is missing").build();
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(secretKey));
            headers.set("Idempotency-Key", "cartly-cancel-" + payment.getOrderId());
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(
                    new LinkedMultiValueMap<>(), headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    STRIPE_PAYMENT_INTENT_URL + "/" + payment.getTransactionId() + "/cancel",
                    request, Map.class);
            Map<String, Object> body = response.getBody();
            String status = body == null ? null : String.valueOf(body.get("status"));
            boolean cancelled = response.getStatusCode().is2xxSuccessful()
                    && "canceled".equalsIgnoreCase(status);
            return ProviderPaymentResult.builder().success(cancelled)
                    .transactionId(payment.getTransactionId())
                    .message(cancelled ? "Stripe payment intent cancelled"
                            : "Stripe did not confirm payment intent cancellation").build();
        } catch (Exception exception) {
            log.error("Stripe cancellation failed for order {}", payment.getOrderId(), exception);
            return ProviderPaymentResult.builder().success(false)
                    .message("Stripe cancellation error: " + exception.getMessage()).build();
        }
    }


    private String basicAuth(String secretKey) {
        String token = secretKey + ":";
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }
}
