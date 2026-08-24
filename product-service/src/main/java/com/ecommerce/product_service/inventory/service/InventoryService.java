package com.ecommerce.product_service.inventory.service;

import com.ecommerce.product_service.inventory.dto.DeductStockRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckResponse;
import com.ecommerce.product_service.inventory.model.Inventory;
import com.ecommerce.product_service.inventory.model.InventoryMutation;
import com.ecommerce.product_service.inventory.repository.InventoryRepository;
import com.ecommerce.product_service.inventory.repository.InventoryMutationRepository;
import com.ecommerce.product_service.model.ProductVariant;
import com.ecommerce.product_service.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryMutationRepository inventoryMutationRepository;

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
        List<UUID> insufficient = new ArrayList<>();
        for (InventoryCheckRequest request : inventoryCheckRequests) {
            if (request.getVariantId() != null) {
                ProductVariant variant = productVariantRepository.findByProductIdAndId(
                        request.getProductId(), request.getVariantId());
                if (variant == null || variant.getQuantityInStock() == null
                        || variant.getQuantityInStock() < request.getQuantity()) {
                    insufficient.add(request.getProductId());
                }
            } else {
                Inventory inventory = inventoryRepository.findByProductIdAndQuantityLessThan(
                        request.getProductId(), request.getQuantity());
                if (inventory != null) {
                    insufficient.add(request.getProductId());
                }
            }
        }
        return InventoryCheckResponse.builder()
                .isNotInStockProductIds(insufficient)
                .isInStock(insufficient.isEmpty())
                .build();
    }

    @Transactional
    public void deductStock(String operationId, List<DeductStockRequest> deductStockRequests) {
        if (!claimMutation(operationId, "DEDUCT")) return;
        for (DeductStockRequest request : deductStockRequests) {
            if (request.getVariantId() != null) {
                ProductVariant variant = productVariantRepository.findLockedByProductIdAndId(
                        request.getProductId(), request.getVariantId());
                if (variant == null) {
                    throw new IllegalStateException("Variant not found: " + request.getVariantId());
                }
                int current = variant.getQuantityInStock() == null ? 0 : variant.getQuantityInStock();
                if (current < request.getQuantity()) {
                    throw new IllegalStateException("Insufficient variant stock: " + request.getVariantId());
                }
                variant.setQuantityInStock(current - request.getQuantity());
                productVariantRepository.save(variant);
            } else {
                Inventory inventory = inventoryRepository.findLockedByProductId(request.getProductId());
                if (inventory == null) {
                    throw new IllegalStateException("Inventory not found: " + request.getProductId());
                }
                int current = inventory.getQuantity() == null ? 0 : inventory.getQuantity();
                if (current < request.getQuantity()) {
                    throw new IllegalStateException("Insufficient stock: " + request.getProductId());
                }
                inventory.setQuantity(current - request.getQuantity());
                inventoryRepository.save(inventory);
            }
        }
    }

    @Transactional
    public void restoreStock(String operationId, List<DeductStockRequest> restoreStockRequests) {
        if (!claimMutation(operationId, "RESTORE")) return;
        for (DeductStockRequest request : restoreStockRequests) {
            if (request.getVariantId() != null) {
                ProductVariant variant = productVariantRepository.findLockedByProductIdAndId(
                        request.getProductId(), request.getVariantId());
                if (variant == null) {
                    throw new IllegalStateException("Variant not found during restoration: " + request.getVariantId());
                }
                int current = variant.getQuantityInStock() == null ? 0 : variant.getQuantityInStock();
                variant.setQuantityInStock(current + request.getQuantity());
                productVariantRepository.save(variant);
            } else {
                Inventory inventory = inventoryRepository.findLockedByProductId(request.getProductId());
                if (inventory == null) {
                    throw new IllegalStateException("Inventory not found during restoration: " + request.getProductId());
                }
                int current = inventory.getQuantity() == null ? 0 : inventory.getQuantity();
                inventory.setQuantity(current + request.getQuantity());
                inventoryRepository.save(inventory);
            }
        }
    }

    private boolean claimMutation(String operationId, String operationType) {
        if (operationId == null || operationId.isBlank() || operationId.length() > 100) {
            throw new IllegalArgumentException("A valid inventory operation id is required");
        }
        if (inventoryMutationRepository.existsById(operationId)) {
            log.info("Inventory operation {} already applied", operationId);
            return false;
        }
        // Flush the unique id before touching stock. A concurrent duplicate
        // fails here and its transaction cannot mutate stock.
        inventoryMutationRepository.saveAndFlush(InventoryMutation.builder()
                .operationId(operationId).operationType(operationType)
                .createdAt(LocalDateTime.now()).build());
        return true;
    }

}
