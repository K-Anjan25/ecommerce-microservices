package com.ecommerce.commerce_service.membership;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartlyPlusMembershipRepository extends JpaRepository<CartlyPlusMembership, UUID> {
    Optional<CartlyPlusMembership> findByUserId(UUID userId);
    List<CartlyPlusMembership> findAllByOrderByUpdatedAtDesc();
}
