package com.ecommerce.commerce_service.client;

import com.ecommerce.commerce_service.dto.inventory.DeductStockRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CommerceInventoryService {

    private final InventoryServiceClient inventoryServiceClient;

    @CircuitBreaker(name = "inventoryService", fallbackMethod = "isInStockFallback")
    public InventoryCheckResponse isInStock(List<InventoryCheckRequest> inventoryCheckRequests) {
        return inventoryServiceClient.isInStock(inventoryCheckRequests);
    }

    @CircuitBreaker(name = "inventoryService", fallbackMethod = "deductStockFallback")
    public void deductStock(List<DeductStockRequest> deductStockRequests) {
        inventoryServiceClient.deductStock(deductStockRequests);
    }

    private InventoryCheckResponse isInStockFallback(List<InventoryCheckRequest> inventoryCheckRequests, Throwable throwable) {
        log.error("Inventory check failed, treating as out of stock: {}", throwable.getMessage());
        return InventoryCheckResponse.builder().isInStock(false).isNotInStockProductIds(List.of()).build();
    }

    private void deductStockFallback(List<DeductStockRequest> deductStockRequests, Throwable throwable) {
        log.error("Stock deduction failed: {}", throwable.getMessage());
    }
}