package com.ecommerce.inventory_service.repository;

import com.ecommerce.inventory_service.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    Inventory findByProductIdAndQuantityLessThan(UUID productId, Integer quantity);
    Inventory getByProductId(UUID productId);
    Long  deleteByProductId(UUID productId);
}