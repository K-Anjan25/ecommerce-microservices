package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.ProductStockWatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductStockWatchRepository extends JpaRepository<ProductStockWatch, UUID> {
    List<ProductStockWatch> findByProductIdAndActiveTrue(UUID productId);

    Optional<ProductStockWatch> findByProductIdAndEmail(UUID productId, String email);

    void deleteByProductIdAndEmail(UUID productId, String email);
}
