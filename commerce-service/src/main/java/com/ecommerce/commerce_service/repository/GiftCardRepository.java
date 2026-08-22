package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.GiftCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GiftCardRepository extends JpaRepository<GiftCard, UUID> {
    Optional<GiftCard> findByCode(String code);
}
