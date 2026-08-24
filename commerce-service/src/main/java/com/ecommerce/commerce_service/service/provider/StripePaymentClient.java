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

import java.math.BigDecimal;
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
            // The browser confirms this intent with Stripe.js. Keeping
            // confirm=false avoids the old hard-coded test payment method and
            // supports cards, wallets and provider-required challenges.
            body.add("automatic_payment_methods[enabled]", "true");
            body.add("description", "Cartly order " + payment.getOrderId());

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(STRIPE_PAYMENT_INTENT_URL, requestEntity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            String paymentIntentId = responseBody != null ? text(responseBody.get("id")) : null;
            String intentStatus = responseBody != null ? text(responseBody.get("status")) : null;
            String clientSecret = responseBody != null ? text(responseBody.get("client_secret")) : null;
            boolean initiated = response.getStatusCode().is2xxSuccessful() && paymentIntentId != null;
            boolean settled = initiated && "succeeded".equalsIgnoreCase(intentStatus);

            return ProviderPaymentResult.builder()
                    .success(initiated)
                    .settled(settled)
                    .transactionId(paymentIntentId)
                    .clientSecret(clientSecret)
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
        return refund(payment, amount, "cartly-refund-" + payment.getOrderId() + "-" + amount.toPlainString());
    }

    @Override
    public ProviderPaymentResult refund(Payment payment, java.math.BigDecimal amount, String idempotencyKey) {
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
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                headers.set("Idempotency-Key", idempotencyKey);
            }

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
    public ProviderPaymentStatus lookup(Payment payment) {
        String secretKey = paymentProviderProperties.getStripe().getSecretKey();
        if (isBlank(secretKey)) {
            return ProviderPaymentStatus.unknown("Stripe secret key is missing");
        }
        if (isBlank(payment.getTransactionId())) {
            return ProviderPaymentStatus.unknown("Stripe payment intent reference is missing");
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(secretKey));
            ResponseEntity<Map> response = restTemplate.exchange(
                    STRIPE_PAYMENT_INTENT_URL + "/" + payment.getTransactionId(),
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);
            Map<String, Object> body = response.getBody();
            String providerId = body == null ? null : text(body.get("id"));
            String status = body == null ? null : text(body.get("status"));
            if (!response.getStatusCode().is2xxSuccessful() || isBlank(providerId) || isBlank(status)) {
                return ProviderPaymentStatus.unknown("Stripe status was not available");
            }
            Object rawAmount = "succeeded".equalsIgnoreCase(status)
                    ? body.get("amount_received") : body.get("amount");
            BigDecimal amount = rawAmount instanceof Number
                    ? BigDecimal.valueOf(((Number) rawAmount).longValue(), 2) : null;
            return ProviderPaymentStatus.builder()
                    .found(true)
                    .settled("succeeded".equalsIgnoreCase(status))
                    // Only a provider-cancelled intent is terminally failed.
                    // requires_action / processing / requires_payment_method
                    // remain pending for a future customer/provider action.
                    .failed("canceled".equalsIgnoreCase(status))
                    .failureReason("canceled".equalsIgnoreCase(status) ? "Stripe payment intent was cancelled" : null)
                    .transactionId(providerId)
                    .amount(amount)
                    .currency(body.get("currency") == null ? null : text(body.get("currency")).toUpperCase())
                    .message("Stripe payment status: " + status)
                    .build();
        } catch (Exception exception) {
            log.warn("Stripe status lookup failed for order {}", payment.getOrderId());
            return ProviderPaymentStatus.unknown("Stripe status lookup failed");
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


    private String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String basicAuth(String secretKey) {
        String token = secretKey + ":";
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }
}
