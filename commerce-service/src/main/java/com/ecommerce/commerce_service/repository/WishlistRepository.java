package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WishlistRepository extends JpaRepository<WishlistItem, UUID> {
    List<WishlistItem> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<WishlistItem> findByUserIdAndProductId(UUID userId, UUID productId);
    void deleteByUserIdAndProductId(UUID userId, UUID productId);
    void deleteByUserId(UUID userId);
}