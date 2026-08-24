package com.ecommerce.commerce_service.service.provider;

import com.ecommerce.commerce_service.config.PaymentProviderProperties;
import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class StripePaymentClientTest {
    @Test
    void chargeCreatesBrowserConfirmableIntentWithoutHardCodedPaymentMethod() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        PaymentProviderProperties properties = new PaymentProviderProperties();
        properties.getStripe().setSecretKey("sk_test");
        StripePaymentClient client = new StripePaymentClient(restTemplate, properties);
        Payment payment = Payment.builder().orderId(UUID.randomUUID()).provider(PaymentProvider.STRIPE)
                .amount(new BigDecimal("125.00")).currency("INR").build();
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("id", "pi_browser_1");
        responseBody.put("status", "requires_payment_method");
        responseBody.put("client_secret", "pi_browser_1_secret");
        doReturn(new ResponseEntity<Map>(responseBody, HttpStatus.OK)).when(restTemplate)
                .postForEntity(eq("https://api.stripe.com/v1/payment_intents"), any(HttpEntity.class), eq(Map.class));

        ProviderPaymentResult result = client.charge(payment);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isSettled()).isFalse();
        assertThat(result.getTransactionId()).isEqualTo("pi_browser_1");
        assertThat(result.getClientSecret()).isEqualTo("pi_browser_1_secret");

        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("https://api.stripe.com/v1/payment_intents"),
                requestCaptor.capture(), eq(Map.class));
        @SuppressWarnings("unchecked")
        MultiValueMap<String, String> requestBody = (MultiValueMap<String, String>) requestCaptor.getValue().getBody();
        assertThat(requestBody.getFirst("automatic_payment_methods[enabled]")).isEqualTo("true");
        assertThat(requestBody.getFirst("confirm")).isNull();
        assertThat(requestBody.getFirst("payment_method")).isNull();
    }
}
