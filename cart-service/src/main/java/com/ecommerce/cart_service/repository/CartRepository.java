package com.ecommerce.cart_service.repository;

import com.ecommerce.cart_service.model.Cart;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends MongoRepository<Cart, String > {
    Optional<Cart> findCartByCustomerId(UUID customerId);
    //Optional<Cart> findCartByCartItemsProductId(UUID productId);
}