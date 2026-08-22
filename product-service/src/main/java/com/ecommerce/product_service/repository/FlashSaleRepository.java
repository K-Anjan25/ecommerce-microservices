package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.FlashSale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {
    List<FlashSale> findByActiveTrueAndStartsAtBeforeAndEndsAtAfterOrderByStartsAtDesc(
            java.time.LocalDateTime now, java.time.LocalDateTime now2);
    Optional<FlashSale> findByProductId(UUID productId);
}
