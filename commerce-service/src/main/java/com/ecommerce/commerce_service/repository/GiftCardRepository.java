package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.GiftCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GiftCardRepository extends JpaRepository<GiftCard, UUID> {
    Optional<GiftCard> findByCode(String code);
    List<GiftCard> findByPurchasedByOrderByCreatedDateDesc(UUID purchasedBy);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM gift_cards g WHERE g.id = :id")
    Optional<GiftCard> findLockedById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM gift_cards g WHERE g.code = :code")
    Optional<GiftCard> findLockedByCode(@Param("code") String code);
}
