package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.config.PaymentProviderProperties;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class PaymentWebhookServiceTest {
    @Test
    void acceptsValidRazorpaySignatureAndReconcilesCapturedPayment() throws Exception {
        PaymentProviderProperties properties = new PaymentProviderProperties();
        properties.getRazorpay().setWebhookSecret("webhook-secret");
        PaymentService payments = mock(PaymentService.class);
        PaymentWebhookService service = new PaymentWebhookService(properties, new ObjectMapper(), payments);
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_ref_1\",\"amount\":12000,\"currency\":\"INR\"}}}}";

        service.handleRazorpay(payload, hmac("webhook-secret", payload));

        verify(payments).reconcileProviderPayment(PaymentProvider.RAZORPAY, "order_ref_1", true, null,
                new java.math.BigDecimal("120.00"), "INR");
    }

    @Test
    void rejectsInvalidRazorpaySignatureBeforeReconciliation() {
        PaymentProviderProperties properties = new PaymentProviderProperties();
        properties.getRazorpay().setWebhookSecret("webhook-secret");
        PaymentService payments = mock(PaymentService.class);
        PaymentWebhookService service = new PaymentWebhookService(properties, new ObjectMapper(), payments);

        assertThatThrownBy(() -> service.handleRazorpay("{}", "invalid"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("signature");
        verifyNoInteractions(payments);
    }

    @Test
    void rejectsStaleStripeWebhookToPreventReplay() throws Exception {
        PaymentProviderProperties properties = new PaymentProviderProperties();
        properties.getStripe().setWebhookSecret("stripe-secret");
        PaymentService payments = mock(PaymentService.class);
        PaymentWebhookService service = new PaymentWebhookService(properties, new ObjectMapper(), payments);
        String payload = "{\"type\":\"payment_intent.succeeded\"}";
        long stale = Instant.now().minusSeconds(600).getEpochSecond();

        assertThatThrownBy(() -> service.handleStripe(payload,
                "t=" + stale + ",v1=" + hmac("stripe-secret", stale + "." + payload)))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("replay window");
        verifyNoInteractions(payments);
    }

    private String hmac(String secret, String content) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
    }
}
