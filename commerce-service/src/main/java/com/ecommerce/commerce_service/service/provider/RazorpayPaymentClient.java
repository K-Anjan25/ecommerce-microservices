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
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RazorpayPaymentClient implements PaymentProviderClient {

    private static final String RAZORPAY_ORDER_URL = "https://api.razorpay.com/v1/orders";
    private final RestTemplate restTemplate;
    private final PaymentProviderProperties paymentProviderProperties;

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.RAZORPAY;
    }

    @Override
    public ProviderPaymentResult charge(Payment payment) {
        String keyId = paymentProviderProperties.getRazorpay().getKeyId();
        String keySecret = paymentProviderProperties.getRazorpay().getKeySecret();
        if (isBlank(keyId) || isBlank(keySecret)) {
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("Razorpay credentials are missing")
                    .build();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(keyId, keySecret));
            headers.set("X-Razorpay-Idempotency-Key", "cartly-order-" + payment.getOrderId());

            Map<String, Object> body = new HashMap<>();
            body.put("amount", payment.getAmount().movePointRight(2).intValue());
            body.put("currency", payment.getCurrency().toUpperCase());
            body.put("receipt", payment.getOrderId().toString());

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(RAZORPAY_ORDER_URL, requestEntity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            String razorpayOrderId = responseBody != null ? String.valueOf(responseBody.get("id")) : null;

            return ProviderPaymentResult.builder()
                    .success(response.getStatusCode().is2xxSuccessful() && razorpayOrderId != null)
                    .settled(false)
                    .transactionId(razorpayOrderId)
                    .message(response.getStatusCode().is2xxSuccessful() ? "Razorpay order created" : "Razorpay order failed")
                    .build();
        } catch (Exception exception) {
            log.error("Razorpay payment failed for orderId {}", payment.getOrderId(), exception);
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("Razorpay error: " + exception.getMessage())
                    .build();
        }
    }

    @Override
    public ProviderPaymentResult refund(Payment payment, java.math.BigDecimal amount) {
        return refund(payment, amount, "cartly-refund-" + payment.getOrderId() + "-" + amount.toPlainString());
    }

    @Override
    public ProviderPaymentResult refund(Payment payment, java.math.BigDecimal amount, String idempotencyKey) {
        String keyId = paymentProviderProperties.getRazorpay().getKeyId();
        String keySecret = paymentProviderProperties.getRazorpay().getKeySecret();
        if (isBlank(keyId) || isBlank(keySecret)) {
            return ProviderPaymentResult.builder()
                    .success(true)
                    .transactionId("SIM-REFUND-" + payment.getOrderId())
                    .message("Razorpay credentials are missing - refund simulated")
                    .build();
        }
        String transactionId = isBlank(payment.getProviderPaymentId())
                ? payment.getTransactionId() : payment.getProviderPaymentId();
        if (isBlank(transactionId)) {
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("No Razorpay payment reference stored for order " + payment.getOrderId())
                    .build();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(keyId, keySecret));
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                headers.set("X-Razorpay-Idempotency-Key", idempotencyKey);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("amount", amount.movePointRight(2).intValue()); // paise
            body.put("speed", "normal");

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.razorpay.com/v1/payments/" + transactionId + "/refund", requestEntity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            String refundId = responseBody != null ? String.valueOf(responseBody.get("id")) : null;

            return ProviderPaymentResult.builder()
                    .success(response.getStatusCode().is2xxSuccessful() && refundId != null)
                    .transactionId(refundId)
                    .message(response.getStatusCode().is2xxSuccessful() ? "Razorpay refund created" : "Razorpay refund failed")
                    .build();
        } catch (Exception exception) {
            log.error("Razorpay refund failed for orderId {}", payment.getOrderId(), exception);
            return ProviderPaymentResult.builder()
                    .success(false)
                    .message("Razorpay refund error: " + exception.getMessage())
                    .build();
        }
    }

    @Override
    public ProviderPaymentStatus lookup(Payment payment) {
        String keyId = paymentProviderProperties.getRazorpay().getKeyId();
        String keySecret = paymentProviderProperties.getRazorpay().getKeySecret();
        if (isBlank(keyId) || isBlank(keySecret)) {
            return ProviderPaymentStatus.unknown("Razorpay credentials are missing");
        }
        if (isBlank(payment.getTransactionId())) {
            return ProviderPaymentStatus.unknown("Razorpay order reference is missing");
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(keyId, keySecret));
            ResponseEntity<Map> response = restTemplate.exchange(
                    RAZORPAY_ORDER_URL + "/" + payment.getTransactionId(),
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);
            Map<String, Object> body = response.getBody();
            String providerId = body == null ? null : text(body.get("id"));
            String status = body == null ? null : text(body.get("status"));
            if (!response.getStatusCode().is2xxSuccessful() || isBlank(providerId) || isBlank(status)) {
                return ProviderPaymentStatus.unknown("Razorpay status was not available");
            }
            Object rawAmount = body.get("amount");
            BigDecimal amount = rawAmount instanceof Number
                    ? BigDecimal.valueOf(((Number) rawAmount).longValue(), 2) : null;
            return ProviderPaymentStatus.builder()
                    .found(true)
                    .settled("paid".equalsIgnoreCase(status))
                    // Razorpay Orders expose no reliable terminal-expiry state
                    // here; created/attempted orders must stay pending.
                    .failed(false)
                    .transactionId(providerId)
                    .amount(amount)
                    .currency(body.get("currency") == null ? null : text(body.get("currency")).toUpperCase())
                    .message("Razorpay order status: " + status)
                    .build();
        } catch (Exception exception) {
            log.warn("Razorpay status lookup failed for order {}", payment.getOrderId());
            return ProviderPaymentStatus.unknown("Razorpay status lookup failed");
        }
    }

    @Override
    public ProviderPaymentResult cancel(Payment payment) {
        // Razorpay Orders have no equivalent server-side cancel endpoint. Do
        // not release Cartly reservations while that provider order can still capture.
        return ProviderPaymentResult.builder().success(false)
                .transactionId(payment.getTransactionId())
                .message("Razorpay order cancellation is not supported; provider reconciliation is required")
                .build();
    }


    private String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String basicAuth(String keyId, String keySecret) {
        String token = keyId + ":" + keySecret;
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}