package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.ShippingZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShippingZoneRepository extends JpaRepository<ShippingZone, UUID> {

    List<ShippingZone> findByActiveTrue();
}
