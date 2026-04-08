package com.ecommerce.inventory_service.controller;

import com.ecommerce.inventory_service.dto.InventoryCheckRequest;
import com.ecommerce.inventory_service.dto.InventoryCheckResponse;
import com.ecommerce.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/v1/inventories")
@RestController
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/isInStock")
    public ResponseEntity<InventoryCheckResponse> isInStock(@RequestBody List<InventoryCheckRequest> inventoryCheckRequests){
        return ResponseEntity.ok(inventoryService.isInStock(inventoryCheckRequests));
    }

}