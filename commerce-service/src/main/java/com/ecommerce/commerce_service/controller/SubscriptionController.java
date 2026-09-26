package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.service.SubscriptionService;
import com.ecommerce.commerce_service.dto.subscription.RescheduleSubscriptionRequest;
import com.ecommerce.commerce_service.dto.subscription.CreateSubscriptionRequest;
import com.ecommerce.commerce_service.dto.subscription.SubscriptionDto;
import com.ecommerce.commerce_service.dto.subscription.UpdateSubscriptionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Subscribe &amp; Save ("auto-reorder"). Customer endpoints operate on the
 * signed-in customer's own subscriptions; {@code /v1/admin/subscriptions} is
 * staff-only (subscription ops + demand forecast).
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/v1/subscriptions")
    public ResponseEntity<List<SubscriptionDto>> getMySubscriptions() {
        return ResponseEntity.ok(subscriptionService.getMySubscriptions());
    }

    @PostMapping("/v1/subscriptions")
    public ResponseEntity<SubscriptionDto> createSubscription(
            @Valid @RequestBody CreateSubscriptionRequest request) {
        return new ResponseEntity<>(subscriptionService.createSubscription(request), HttpStatus.CREATED);
    }

    @PutMapping("/v1/subscriptions/{id}")
    public ResponseEntity<SubscriptionDto> updateSubscription(@PathVariable UUID id,
                                                              @Valid @RequestBody UpdateSubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.updateSubscription(id, request));
    }

    /** Skip just the upcoming delivery (Amazon "Skip this delivery"). */
    @PostMapping("/v1/subscriptions/{id}/skip")
    public ResponseEntity<SubscriptionDto> skipNext(@PathVariable UUID id) {
        return ResponseEntity.ok(subscriptionService.skipNext(id));
    }

    /** Move the next delivery to another date. */
    @PostMapping("/v1/subscriptions/{id}/reschedule")
    public ResponseEntity<SubscriptionDto> reschedule(@PathVariable UUID id,
                                                      @Valid @RequestBody RescheduleSubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.reschedule(id, request.getNextDeliveryDate()));
    }

    /** Soft cancel — history is kept. */
    @DeleteMapping("/v1/subscriptions/{id}")
    public ResponseEntity<SubscriptionDto> cancelSubscription(@PathVariable UUID id) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(id));
    }

    // ── Admin (staff) ───────────────────────────────────────────────────────

    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN')")
    @GetMapping("/v1/admin/subscriptions")
    public ResponseEntity<List<SubscriptionDto>> adminList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(subscriptionService.adminList(from, to));
    }

    /** Upcoming auto-reorder demand grouped by ISO week. */
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN')")
    @GetMapping("/v1/admin/subscriptions/forecast")
    public ResponseEntity<List<Map<String, Object>>> adminForecast(
            @RequestParam(defaultValue = "8") int weeks) {
        return ResponseEntity.ok(subscriptionService.adminForecast(weeks));
    }
}
