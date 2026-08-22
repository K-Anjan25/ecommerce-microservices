package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.TaxRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TaxRuleRepository extends JpaRepository<TaxRule, UUID> {
    Optional<TaxRule> findByStateAndActiveTrue(String state);
}
