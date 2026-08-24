package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.payment.PaymentRequest;
import com.ecommerce.commerce_service.dto.payment.PaymentResponse;
import com.ecommerce.commerce_service.service.PaymentService;
import com.ecommerce.commerce_service.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentWebhookService paymentWebhookService;

    @PostMapping
    public ResponseEntity<PaymentResponse> makePayment(@Valid @RequestBody PaymentRequest request,
                                                       // Optional so guest checkout (no AuthFilter → no header) works;
                                                       // logged-in requests are forwarded by the gateway with userId set.
                                                       @RequestHeader(value = "userId", required = false) String userId) {
        log.info("payment request received for order {} from user {}", request.getOrderId(), userId);
        UUID customerUuid = (userId == null || userId.isBlank()) ? null : UUID.fromString(userId);
        return new ResponseEntity<>(paymentService.processPayment(request, customerUuid), HttpStatus.CREATED);
    }


    /** Customer-scoped status polling for a pending browser payment. */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PaymentResponse> getPaymentForOrder(@PathVariable UUID orderId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID customerId = UUID.fromString(String.valueOf(authentication.getPrincipal()));
        boolean staff = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_SUPER_ADMIN"));
        return ResponseEntity.ok(paymentService.getPaymentForOrder(orderId, customerId, staff));
    }

    @PostMapping("/webhooks/stripe")
    public ResponseEntity<Void> stripeWebhook(@RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        paymentWebhookService.handleStripe(payload, signature);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/webhooks/razorpay")
    public ResponseEntity<Void> razorpayWebhook(@RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentWebhookService.handleRazorpay(payload, signature);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public String test() {
        return "Payment Service is running";
    }
}
