package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;

import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    void deleteByProductId(UUID productId);

    ProductVariant findByProductIdAndId(UUID productId, UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM product_variants v WHERE v.product.id = :productId AND v.id = :id")
    ProductVariant findLockedByProductIdAndId(@Param("productId") UUID productId, @Param("id") UUID id);
}