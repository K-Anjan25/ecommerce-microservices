package com.ecommerce.commerce_service.service;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;

class CheckoutTokenServiceTest {
    @Test
    void issuesHashedUnforgeableCapabilities() {
        CheckoutTokenService service = new CheckoutTokenService();
        String raw = service.issue();
        String hash = service.hash(raw);

        assertThat(raw).hasSizeGreaterThan(40).doesNotContain("=");
        assertThat(hash).hasSize(64).isNotEqualTo(raw);
        assertThat(service.matches(raw, hash)).isTrue();
        assertThat(service.matches(raw + "x", hash)).isFalse();
        assertThat(service.matches(null, hash)).isFalse();
        assertThat(service.matches(raw, hash, LocalDateTime.now().plusMinutes(1))).isTrue();
        assertThat(service.matches(raw, hash, LocalDateTime.now().minusSeconds(1))).isFalse();
        assertThat(service.matches(raw, hash, null)).isFalse();
    }
}
