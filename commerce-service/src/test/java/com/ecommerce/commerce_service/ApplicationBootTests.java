package com.ecommerce.commerce_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Boots the FULL Spring context against in-memory H2 (PostgreSQL mode).
 *
 * This is the only test layer that validates Hibernate's view of the entity
 * model — @Index columnList / @UniqueConstraint columnNames errors (property
 * names instead of column names), duplicated mappings and similar
 * AnnotationExceptions crash HERE in CI instead of killing the service at
 * production startup (see the support_ticket boot outage).
 *
 * Rabbit listeners are switched off: no broker is present in CI, and Spring
 * AMQP connections are retried in the background without failing the context.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:commerce_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
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
