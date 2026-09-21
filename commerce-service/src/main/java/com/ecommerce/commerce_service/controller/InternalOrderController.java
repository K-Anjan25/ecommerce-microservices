package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Service-to-service lookups (product-service verifies review authors).
 * Guarded by the shared internal secret — never exposed through the gateway.
 */
@RestController
@RequestMapping("/internal/orders")
@RequiredArgsConstructor
public class InternalOrderController {

    private final OrderService orderService;

    @Value("${internal-service.secret:cartly-internal-dev-only}")
    private String internalSecret;

    @GetMapping("/verified-purchase")
    public ResponseEntity<Map<String, Boolean>> verifiedPurchase(
            @RequestHeader(value = "X-Internal-Service", required = false) String suppliedSecret,
            @RequestParam UUID customerId,
            @RequestParam UUID productId) {
        if (suppliedSecret == null || !suppliedSecret.equals(internalSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(Map.of(
                "verified", orderService.isVerifiedPurchase(customerId, productId)));
    }
}
