package com.ecommerce.product_service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Dev-path guarantee for catalog search: the trigram queries in
 * {@code ProductRepository} require the pg_trgm extension, but development
 * runs with Flyway disabled and Hibernate's ddl-auto never creates extensions.
 * This runner applies {@code CREATE EXTENSION IF NOT EXISTS pg_trgm} on boot
 * (the V3 Flyway migration covers the production path; both are idempotent).
 * A database without permission to install extensions logs a warning and the
 * app continues — search then degrades to an explicit DBA step.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class SearchExtensionInitializer {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    public CommandLineRunner ensurePgTrgmExtension() {
        return args -> {
            try {
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
                log.info("pg_trgm extension verified for catalog search");
            } catch (Exception e) {
                log.warn("Could not create pg_trgm extension ({}). "
                        + "Catalog similarity search needs it; ask a DBA to run "
                        + "CREATE EXTENSION IF NOT EXISTS pg_trgm on this database.", e.getMessage());
            }
        };
    }
}
