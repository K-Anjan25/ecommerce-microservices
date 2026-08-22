package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.ProductPriceWatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductPriceWatchRepository extends JpaRepository<ProductPriceWatch, UUID> {
    List<ProductPriceWatch> findByProductIdAndActiveTrue(UUID productId);

    Optional<ProductPriceWatch> findByProductIdAndEmail(UUID productId, String email);

    void deleteByProductIdAndEmail(UUID productId, String email);
}
