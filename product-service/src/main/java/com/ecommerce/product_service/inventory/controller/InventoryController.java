package com.ecommerce.product_service.inventory.controller;

import com.ecommerce.product_service.inventory.dto.DeductStockRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckResponse;
import com.ecommerce.product_service.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@RestController
@RequestMapping("/v1/inventories")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @Value("${internal-service.secret:cartly-internal-dev-only}")
    private String internalSecret;

    @PostMapping("/isInStock")
    public ResponseEntity<InventoryCheckResponse> isInStock(
            @RequestHeader(value = "X-Internal-Service", required = false) String suppliedSecret,
            @RequestBody List<InventoryCheckRequest> inventoryCheckRequests) {
        requireInternalService(suppliedSecret);
        return ResponseEntity.ok(inventoryService.isInStock(inventoryCheckRequests));
    }

    @PostMapping("/deductStock")
    public ResponseEntity<Void> deductStock(
            @RequestHeader(value = "X-Internal-Service", required = false) String suppliedSecret,
            @RequestHeader("X-Idempotency-Key") String operationId,
            @RequestBody List<DeductStockRequest> deductStockRequests) {
        requireInternalService(suppliedSecret);
        try {
            inventoryService.deductStock(operationId, deductStockRequests);
        } catch (DataIntegrityViolationException duplicateOperation) {
            // The unique operation claim is flushed before stock is touched;
            // a concurrent duplicate safely rolls back and is acknowledged.
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/restoreStock")
    public ResponseEntity<Void> restoreStock(
            @RequestHeader(value = "X-Internal-Service", required = false) String suppliedSecret,
            @RequestHeader("X-Idempotency-Key") String operationId,
            @RequestBody List<DeductStockRequest> restoreStockRequests) {
        requireInternalService(suppliedSecret);
        try {
            inventoryService.restoreStock(operationId, restoreStockRequests);
        } catch (DataIntegrityViolationException duplicateOperation) {
            // See deductStock: duplicate claim means the other transaction owns the mutation.
        }
        return ResponseEntity.ok().build();
    }

    private void requireInternalService(String suppliedSecret) {
        if (suppliedSecret == null || !MessageDigest.isEqual(
                internalSecret.getBytes(StandardCharsets.UTF_8),
                suppliedSecret.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Internal service authentication required");
        }
    }
}
