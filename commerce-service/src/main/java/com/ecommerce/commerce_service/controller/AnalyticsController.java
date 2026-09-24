package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.AnalyticsSummaryDto;
import com.ecommerce.commerce_service.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** Public, fire-and-forget storefront beacon. Unknown types are dropped. */
    @PostMapping("/events")
    public ResponseEntity<Void> recordEvent(@RequestBody Map<String, Object> body) {
        String type = String.valueOf(body.getOrDefault("type", ""));
        if (List.of("VIEW_PRODUCT", "ADD_TO_CART", "CHECKOUT_STARTED", "ORDER_COMPLETED").contains(type)) {
            UUID productId = null;
            Object raw = body.get("productId");
            if (raw != null) {
                try {
                    productId = UUID.fromString(String.valueOf(raw));
                } catch (IllegalArgumentException ignored) {
                    /* anonymous event */
                }
            }
            analyticsService.record(type, String.valueOf(body.getOrDefault("sessionId", "anonymous")), productId);
        }
        return ResponseEntity.noContent().build();
    }

    /** Admin dashboard (role-gated client-side, authenticated here). */
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryDto> summary(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.summary(days));
    }
}
