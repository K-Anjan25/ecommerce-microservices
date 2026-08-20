package com.ecommerce.product_service.inventory.repository;

import com.ecommerce.product_service.inventory.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    Inventory findByProductIdAndQuantityLessThan(UUID productId, Integer quantity);
    Inventory getByProductId(UUID productId);
    Long deleteByProductId(UUID productId);
}
