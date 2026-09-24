package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.subscription.CreateSubscriptionRequest;
import com.ecommerce.commerce_service.dto.subscription.SubscriptionDto;
import com.ecommerce.commerce_service.dto.subscription.UpdateSubscriptionRequest;
import com.ecommerce.commerce_service.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

/**
 * Auto-reorder subscriptions ("Subscribe & Save"). All endpoints operate on
 * the signed-in customer's own subscriptions.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<List<SubscriptionDto>> getMySubscriptions() {
        return ResponseEntity.ok(subscriptionService.getMySubscriptions());
    }

    @PostMapping
    public ResponseEntity<SubscriptionDto> createSubscription(
            @Valid @RequestBody CreateSubscriptionRequest request) {
        return new ResponseEntity<>(subscriptionService.createSubscription(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionDto> updateSubscription(@PathVariable UUID id,
                                                              @Valid @RequestBody UpdateSubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.updateSubscription(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelSubscription(@PathVariable UUID id) {
        subscriptionService.cancelSubscription(id);
        return ResponseEntity.noContent().build();
    }
}
