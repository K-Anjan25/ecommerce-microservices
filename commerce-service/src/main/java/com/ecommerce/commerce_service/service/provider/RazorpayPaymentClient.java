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

    private String basicAuth(String keyId, String keySecret) {
        String token = keyId + ":" + keySecret;
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
