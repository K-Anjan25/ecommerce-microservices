package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.ShippingRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShippingRateRepository extends JpaRepository<ShippingRate, UUID> {
    Optional<ShippingRate> findByPincodeAndActiveTrue(String pincode);
}
