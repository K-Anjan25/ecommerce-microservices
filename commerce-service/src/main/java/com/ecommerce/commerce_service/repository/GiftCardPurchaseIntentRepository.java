package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface GiftCardPurchaseIntentRepository extends JpaRepository<GiftCardPurchaseIntent, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM gift_card_purchase_intents i WHERE i.orderId = :orderId")
    Optional<GiftCardPurchaseIntent> findLockedByOrderId(@Param("orderId") UUID orderId);
}
