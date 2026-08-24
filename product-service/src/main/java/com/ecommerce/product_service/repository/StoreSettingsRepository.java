package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
}
