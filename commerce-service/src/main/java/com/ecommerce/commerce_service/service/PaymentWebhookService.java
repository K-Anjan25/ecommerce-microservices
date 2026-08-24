package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.config.PaymentProviderProperties;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class PaymentWebhookService {
    private static final long STRIPE_TOLERANCE_SECONDS = 300;

    private final PaymentProviderProperties properties;
    private final ObjectMapper objectMapper;
    private final PaymentService paymentService;

    public void handleStripe(String payload, String signatureHeader) {
        String secret = properties.getStripe().getWebhookSecret();
        requireConfigured(secret, "Stripe");
        StripeSignature signature = parseStripeSignature(signatureHeader);
        if (Math.abs(Instant.now().getEpochSecond() - signature.timestamp) > STRIPE_TOLERANCE_SECONDS) {
            throw new SecurityException("Stripe webhook timestamp is outside the replay window");
        }
        String expected = hmacHex(secret, signature.timestamp + "." + payload);
        requireSignature(expected, signature.signature, "Stripe");
        JsonNode event = read(payload);
        String type = event.path("type").asText();
        JsonNode payment = event.path("data").path("object");
        String reference = payment.path("id").asText();
        if (reference.isBlank()) throw new IllegalArgumentException("Stripe payment reference is missing");
        if ("payment_intent.succeeded".equals(type)) {
            paymentService.reconcileProviderPayment(PaymentProvider.STRIPE, reference, true, null,
                    minorUnits(payment, "amount_received"), payment.path("currency").asText());
        } else if ("payment_intent.payment_failed".equals(type)) {
            String reason = payment.path("last_payment_error").path("message").asText("Provider payment failed");
            paymentService.reconcileProviderPayment(PaymentProvider.STRIPE, reference, false, reason,
                    minorUnits(payment, "amount"), payment.path("currency").asText());
        }
    }

    public void handleRazorpay(String payload, String signatureHeader) {
        String secret = properties.getRazorpay().getWebhookSecret();
        requireConfigured(secret, "Razorpay");
        requireSignature(hmacHex(secret, payload), signatureHeader, "Razorpay");
        JsonNode event = read(payload);
        String type = event.path("event").asText();
        JsonNode payment = event.path("payload").path("payment").path("entity");
        String reference = payment.path("order_id").asText();
        if (reference.isBlank()) throw new IllegalArgumentException("Razorpay order reference is missing");
        if ("payment.captured".equals(type)) {
            paymentService.reconcileProviderPayment(PaymentProvider.RAZORPAY, reference, true, null,
                    minorUnits(payment, "amount"), payment.path("currency").asText());
        } else if ("payment.failed".equals(type)) {
            paymentService.reconcileProviderPayment(PaymentProvider.RAZORPAY, reference, false,
                    payment.path("error_description").asText("Provider payment failed"),
                    minorUnits(payment, "amount"), payment.path("currency").asText());
        }
    }

    private BigDecimal minorUnits(JsonNode payment, String field) {
        if (!payment.has(field) || !payment.path(field).canConvertToLong()) {
            throw new IllegalArgumentException("Provider payment amount is missing");
        }
        return BigDecimal.valueOf(payment.path(field).longValue(), 2);
    }

    private JsonNode read(String payload) {
        try { return objectMapper.readTree(payload); }
        catch (Exception exception) { throw new IllegalArgumentException("Invalid payment webhook payload", exception); }
    }

    private void requireConfigured(String secret, String provider) {
        if (secret == null || secret.isBlank()) throw new SecurityException(provider + " webhook is not configured");
    }

    private void requireSignature(String expectedHex, String suppliedHex, String provider) {
        if (suppliedHex == null || !MessageDigest.isEqual(expectedHex.getBytes(StandardCharsets.US_ASCII),
                suppliedHex.getBytes(StandardCharsets.US_ASCII))) {
            throw new SecurityException(provider + " webhook signature is invalid");
        }
    }

    private String hmacHex(String secret, String content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not verify payment webhook", exception);
        }
    }

    private StripeSignature parseStripeSignature(String header) {
        if (header == null) throw new SecurityException("Stripe webhook signature is missing");
        Long timestamp = null;
        String signature = null;
        for (String part : header.split(",")) {
            String[] value = part.trim().split("=", 2);
            if (value.length == 2 && "t".equals(value[0])) {
                try { timestamp = Long.valueOf(value[1]); }
                catch (NumberFormatException malformed) { throw new SecurityException("Stripe webhook timestamp is malformed"); }
            }
            if (value.length == 2 && "v1".equals(value[0])) signature = value[1];
        }
        if (timestamp == null || signature == null) throw new SecurityException("Stripe webhook signature is malformed");
        return new StripeSignature(timestamp, signature);
    }

    private static final class StripeSignature {
        private final long timestamp;
        private final String signature;
        private StripeSignature(long timestamp, String signature) { this.timestamp = timestamp; this.signature = signature; }
    }
}
