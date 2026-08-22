package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.SavedAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SavedAddressRepository extends JpaRepository<SavedAddress, UUID> {
    List<SavedAddress> findByCustomerIdOrderByDefaultAddressDescCreatedDateDesc(UUID customerId);
}
