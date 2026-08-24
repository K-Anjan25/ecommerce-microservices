package com.ecommerce.commerce_service.service.provider;

import com.ecommerce.commerce_service.config.PaymentProviderProperties;
import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentProviderLookupTest {
    @Test
    void stripeLookupRecognizesOnlySucceededAsSettled() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        PaymentProviderProperties properties = new PaymentProviderProperties();
        properties.getStripe().setSecretKey("sk_test");
        StripePaymentClient client = new StripePaymentClient(restTemplate, properties);
        Payment payment = payment(PaymentProvider.STRIPE, "pi_123");
        Map<String, Object> body = new HashMap<>();
        body.put("id", "pi_123");
        body.put("status", "succeeded");
        body.put("amount", 12500);
        body.put("amount_received", 12500);
        body.put("currency", "inr");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        ProviderPaymentStatus result = client.lookup(payment);

        assertThat(result.isFound()).isTrue();
        assertThat(result.isSettled()).isTrue();
        assertThat(result.isFailed()).isFalse();
        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("125.00"));
        assertThat(result.getCurrency()).isEqualTo("INR");
        verify(restTemplate).exchange(contains("pi_123"), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void stripeCancellationIsTerminalFailureButRequiresActionStaysPending() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        PaymentProviderProperties properties = new PaymentProviderProperties();
        properties.getStripe().setSecretKey("sk_test");
        StripePaymentClient client = new StripePaymentClient(restTemplate, properties);
        Payment payment = payment(PaymentProvider.STRIPE, "pi_456");
        Map<String, Object> body = new HashMap<>();
        body.put("id", "pi_456");
        body.put("status", "requires_action");
        body.put("amount", 5000);
        body.put("currency", "inr");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        ProviderPaymentStatus result = client.lookup(payment);

        assertThat(result.isFound()).isTrue();
        assertThat(result.isSettled()).isFalse();
        assertThat(result.isFailed()).isFalse();

        body.put("status", "canceled");
        ProviderPaymentStatus cancelled = client.lookup(payment);
        assertThat(cancelled.isFailed()).isTrue();
        assertThat(cancelled.getFailureReason()).contains("cancelled");
    }

    @Test
    void razorpayAttemptedOrderStaysPending() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        PaymentProviderProperties properties = new PaymentProviderProperties();
        properties.getRazorpay().setKeyId("rzp_test");
        properties.getRazorpay().setKeySecret("secret");
        RazorpayPaymentClient client = new RazorpayPaymentClient(restTemplate, properties);
        Payment payment = payment(PaymentProvider.RAZORPAY, "order_123");
        Map<String, Object> body = new HashMap<>();
        body.put("id", "order_123");
        body.put("status", "attempted");
        body.put("amount", 7999);
        body.put("currency", "INR");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        ProviderPaymentStatus result = client.lookup(payment);

        assertThat(result.isFound()).isTrue();
        assertThat(result.isSettled()).isFalse();
        assertThat(result.isFailed()).isFalse();
        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("79.99"));
    }

    @Test
    void missingProviderCredentialsNeverCallsRemoteApi() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        PaymentProviderProperties properties = new PaymentProviderProperties();
        StripePaymentClient client = new StripePaymentClient(restTemplate, properties);

        ProviderPaymentStatus result = client.lookup(payment(PaymentProvider.STRIPE, "pi_missing"));

        assertThat(result.isFound()).isFalse();
        assertThat(result.getMessage()).contains("missing");
        verifyNoInteractions(restTemplate);
    }

    private Payment payment(PaymentProvider provider, String transactionId) {
        return Payment.builder().orderId(UUID.randomUUID()).provider(provider)
                .transactionId(transactionId).amount(new BigDecimal("125.00"))
                .currency("INR").status("PENDING").build();
    }
}
