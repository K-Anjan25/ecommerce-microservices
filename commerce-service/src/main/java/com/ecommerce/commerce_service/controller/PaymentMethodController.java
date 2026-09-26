package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.model.SavedPaymentMethod;
import com.ecommerce.commerce_service.service.SavedPaymentMethodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** Saved ("vaulted") payment methods used by Subscribe &amp; Save auto-charges. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/payment-methods")
public class PaymentMethodController {

    private final SavedPaymentMethodService service;

    /** Never expose the provider token — only brand/last4/default metadata. */
    public static java.util.Map<String, Object> viewOf(SavedPaymentMethod m) {
        java.util.Map<String, Object> view = new java.util.LinkedHashMap<>();
        view.put("id", m.getId());
        view.put("provider", m.getProvider().name());
        view.put("brand", m.getBrand());
        view.put("last4", m.getLast4());
        view.put("isDefault", m.isDefault());
        return view;
    }

    @GetMapping
    public ResponseEntity<List<java.util.Map<String, Object>>> myMethods() {
        return ResponseEntity.ok(service.myMethods().stream()
                .map(PaymentMethodController::viewOf).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<java.util.Map<String, Object>> save(@RequestBody SavedPaymentMethod request) {
        return new ResponseEntity<>(viewOf(service.save(request)), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
