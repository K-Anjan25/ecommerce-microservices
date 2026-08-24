package com.ecommerce.product_service.inventory.repository;

import com.ecommerce.product_service.inventory.model.InventoryMutation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryMutationRepository extends JpaRepository<InventoryMutation, String> {
}
