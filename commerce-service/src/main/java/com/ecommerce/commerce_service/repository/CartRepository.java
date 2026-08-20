package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {
    Optional<Cart> findCartByCustomerId(UUID customerId);
}
