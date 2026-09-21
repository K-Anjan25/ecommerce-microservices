package com.ecommerce.commerce_service.resources;

import com.ecommerce.commerce_service.model.ShippingZone;
import com.ecommerce.commerce_service.repository.ShippingZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Seeds one starter international zone the first time the service boots with
 * an empty zone table, so the storefront has something honest to quote
 * against. Staff can edit or replace it from the admin console.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShippingZoneSeeder implements CommandLineRunner {

    private final ShippingZoneRepository repository;

    @Override
    @Transactional
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }
        repository.save(ShippingZone.builder()
                .name("International — Zone 1")
                .countries("US,CA,GB,DE,FR,NL,BE,ES,SE,CH,AE,SG,AU,NZ,JP,KR")
                .cost(new BigDecimal("2499.00"))
                .freeAbove(new BigDecimal("25000.00"))
                .estimatedDaysMin(7)
                .estimatedDaysMax(14)
                .carrier("DHL Express")
                .dutyRate(new BigDecimal("0.1500"))
                .dutyName("Import duty & VAT")
                .active(true)
                .build());
        log.info("Seeded starter international shipping zone");
    }
}
