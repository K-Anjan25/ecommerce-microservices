package com.ecommerce.commerce_service.newsletter;

import com.ecommerce.commerce_service.dto.newsletter.SubscribeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

/**
 * Newsletter signups from the storefront footer. Public and idempotent —
 * subscribing twice is not an error.
 */
@RestController
@RequestMapping("/v1/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterService service;

    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(
            @Valid @RequestBody SubscribeRequest request,
            @RequestHeader(value = "X-Signup-Source", defaultValue = "FOOTER") String source) {
        NewsletterService.SubscribeResult result =
                service.subscribe(request.getEmail(), sanitizeSource(source));
        return ResponseEntity.ok(Map.of(
                "status", result.status(),
                "email", result.subscriber().getEmail()));
    }

    private String sanitizeSource(String source) {
        String cleaned = source == null ? "" : source.trim().toUpperCase();
        return cleaned.length() > 30 ? cleaned.substring(0, 30) : cleaned;
    }
}
