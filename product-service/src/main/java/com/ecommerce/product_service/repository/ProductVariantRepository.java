package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    void deleteByProductId(UUID productId);

    ProductVariant findByProductIdAndId(UUID productId, UUID id);
}