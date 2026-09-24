package com.ecommerce.commerce_service.membership;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/** Self-service Cartly Plus membership (join / manage), routed via the gateway. */
@RestController
@RequestMapping("/v1/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping
    public ResponseEntity<MembershipStatusDto> status(Principal principal) {
        return ResponseEntity.ok(membershipService.status(currentUserId(principal)));
    }

    /** Idempotent join/renew — the app's fixed plan prices live server-side. */
    @PostMapping("/join")
    public ResponseEntity<MembershipStatusDto> join(Principal principal,
                                                    @RequestBody Map<String, String> body) {
        String plan = body.getOrDefault("plan", "");
        return ResponseEntity.ok(membershipService.join(currentUserId(principal), plan));
    }

    /** Keep benefits until the period end; stops the auto-renew charge. */
    @PostMapping("/cancel")
    public ResponseEntity<MembershipStatusDto> cancel(Principal principal) {
        return ResponseEntity.ok(membershipService.cancel(currentUserId(principal)));
    }

    @PostMapping("/auto-renew")
    public ResponseEntity<MembershipStatusDto> autoRenew(Principal principal,
                                                         @RequestBody Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.getOrDefault("enabled", Boolean.TRUE));
        return ResponseEntity.ok(membershipService.setAutoRenew(currentUserId(principal), enabled));
    }

    private UUID currentUserId(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to manage Cartly Plus");
        }
        try {
            return UUID.fromString(principal.getName());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid caller identity");
        }
    }
}
