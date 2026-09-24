package com.ecommerce.user_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Boots the FULL Spring context against in-memory H2 (PostgreSQL mode) so
 * Hibernate entity-metadata problems (bad @Index/@UniqueConstraint column
 * names, duplicated mappings) crash CI instead of production startup.
 * Rabbit listeners off — no broker in CI (background retries, never fatal).
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:user_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.rabbitmq.listener.simple.auto-startup=false"
})
class ApplicationBootTests {

    @Test
    void contextLoads() {
        // Reaching this point means the EntityManagerFactory built successfully.
    }
}
