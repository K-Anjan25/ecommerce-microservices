package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {
    void deleteByProductId(UUID productId);
}