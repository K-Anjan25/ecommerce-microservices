package com.ecommerce.product_service.inventory.repository;

import com.ecommerce.product_service.inventory.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;

import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    Inventory findByProductIdAndQuantityLessThan(UUID productId, Integer quantity);
    Inventory getByProductId(UUID productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM inventories i WHERE i.productId = :productId")
    Inventory findLockedByProductId(@Param("productId") UUID productId);

    Long deleteByProductId(UUID productId);
}
