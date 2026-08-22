package com.ecommerce.product_service.inventory.service;

import com.ecommerce.product_service.inventory.dto.DeductStockRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckRequest;
import com.ecommerce.product_service.inventory.dto.InventoryCheckResponse;
import com.ecommerce.product_service.inventory.model.Inventory;
import com.ecommerce.product_service.inventory.repository.InventoryRepository;
import com.ecommerce.product_service.model.ProductVariant;
import com.ecommerce.product_service.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository productVariantRepository;

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
    public void deductStock(List<DeductStockRequest> deductStockRequests) {
        for (DeductStockRequest request : deductStockRequests) {
            if (request.getVariantId() != null) {
                ProductVariant variant = productVariantRepository.findByProductIdAndId(
                        request.getProductId(), request.getVariantId());
                if (variant != null) {
                    int newQuantity = (variant.getQuantityInStock() == null ? 0 : variant.getQuantityInStock())
                            - request.getQuantity();
                    variant.setQuantityInStock(Math.max(newQuantity, 0));
                    productVariantRepository.save(variant);
                }
            } else {
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

    @Transactional
    public void restoreStock(List<DeductStockRequest> restoreStockRequests) {
        for (DeductStockRequest request : restoreStockRequests) {
            if (request.getVariantId() != null) {
                ProductVariant variant = productVariantRepository.findByProductIdAndId(
                        request.getProductId(), request.getVariantId());
                if (variant != null) {
                    int current = variant.getQuantityInStock() == null ? 0 : variant.getQuantityInStock();
                    variant.setQuantityInStock(current + request.getQuantity());
                    productVariantRepository.save(variant);
                }
            } else {
                Inventory inventory = inventoryRepository.getByProductId(request.getProductId());
                if (inventory != null) {
                    int current = inventory.getQuantity() == null ? 0 : inventory.getQuantity();
                    inventory.setQuantity(current + request.getQuantity());
                    inventoryRepository.save(inventory);
                }
            }
        }
    }
}
