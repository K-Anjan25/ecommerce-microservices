package com.ecommerce.product_service.inventory.service;

import com.ecommerce.product_service.inventory.dto.DeductStockRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckResponse;
import com.ecommerce.product_service.inventory.model.Inventory;
import com.ecommerce.product_service.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {
    private final InventoryRepository inventoryRepository;

    @Transactional
    public void upsertStock(UUID productId, Integer quantity) {
        Inventory inventory = inventoryRepository.getByProductId(productId);
        if (inventory == null) {
            inventory = Inventory.builder()
                    .productId(productId)
                    .quantity(quantity)
                    .build();
        } else {
            inventory.setQuantity(quantity);
        }
        inventoryRepository.save(inventory);
    }

    @Transactional
    public void deleteProductFromInventory(UUID productId) {
        inventoryRepository.deleteByProductId(productId);
    }

    public InventoryCheckResponse isInStock(List<InventoryCheckRequest> inventoryCheckRequests) {
        List<UUID> insufficient = inventoryCheckRequests.stream()
                .map(request -> inventoryRepository.findByProductIdAndQuantityLessThan(request.getProductId(), request.getQuantity()))
                .filter(Objects::nonNull)
                .map(Inventory::getProductId)
                .collect(Collectors.toList());

        return InventoryCheckResponse.builder()
                .isNotInStockProductIds(insufficient)
                .isInStock(insufficient.isEmpty())
                .build();
    }

    @Transactional
    public void deductStock(List<DeductStockRequest> deductStockRequests) {
        for (DeductStockRequest request : deductStockRequests) {
            Inventory inventory = inventoryRepository.getByProductId(request.getProductId());
            if (inventory != null) {
                int newQuantity = inventory.getQuantity() - request.getQuantity();
                if (newQuantity < 0) {
                    log.warn("Insufficient stock for product {}: requested {}, available {}",
                            request.getProductId(), request.getQuantity(), inventory.getQuantity());
                    newQuantity = 0;
                }
                inventory.setQuantity(newQuantity);
                inventoryRepository.save(inventory);
            }
        }
    }
}
