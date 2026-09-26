package com.ecommerce.commerce_service.membership;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Service-to-service membership lookup (product-service gates flash-sale early
 * access with it). Guarded by the shared internal secret — never via gateway.
 */
@RestController
@RequestMapping("/internal/memberships")
@RequiredArgsConstructor
public class InternalMembershipController {

    private final MembershipService membershipService;

    @Value("${internal-service.secret:cartly-internal-dev-only}")
    private String internalSecret;

    @GetMapping("/active/{userId}")
    public ResponseEntity<Map<String, Boolean>> active(
            @RequestHeader(value = "X-Internal-Service", required = false) String suppliedSecret,
            @PathVariable UUID userId) {
        if (suppliedSecret == null || !suppliedSecret.equals(internalSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(Map.of("active", membershipService.isPlusActive(userId)));
    }
}
