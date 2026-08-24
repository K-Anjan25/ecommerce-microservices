package com.ecommerce.commerce_service.client;

import com.ecommerce.commerce_service.dto.inventory.DeductStockRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(
        name = "product-service",
        url = "${product-service.url}",
        path = "/v1/inventories"
)
public interface InventoryServiceClient {

    @PostMapping("/isInStock")
    InventoryCheckResponse isInStock(@RequestBody List<InventoryCheckRequest> inventoryCheckRequest);

    @PostMapping("/deductStock")
    void deductStock(@RequestHeader("X-Idempotency-Key") String operationId,
                     @RequestBody List<DeductStockRequest> deductStockRequests);

    @PostMapping("/restoreStock")
    void restoreStock(@RequestHeader("X-Idempotency-Key") String operationId,
                      @RequestBody List<DeductStockRequest> restoreStockRequests);
}
