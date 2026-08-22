package com.ecommerce.product_service.inventory.controller;

import com.ecommerce.product_service.inventory.dto.DeductStockRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckResponse;
import com.ecommerce.product_service.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/inventories")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/isInStock")
    public ResponseEntity<InventoryCheckResponse> isInStock(@RequestBody List<InventoryCheckRequest> inventoryCheckRequests) {
        return ResponseEntity.ok(inventoryService.isInStock(inventoryCheckRequests));
    }

    @PostMapping("/deductStock")
    public ResponseEntity<Void> deductStock(@RequestBody List<DeductStockRequest> deductStockRequests) {
        inventoryService.deductStock(deductStockRequests);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/restoreStock")
    public ResponseEntity<Void> restoreStock(@RequestBody List<DeductStockRequest> restoreStockRequests) {
        inventoryService.restoreStock(restoreStockRequests);
        return ResponseEntity.ok().build();
    }
}
