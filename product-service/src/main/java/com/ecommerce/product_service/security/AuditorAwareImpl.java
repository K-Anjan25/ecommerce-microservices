package com.ecommerce.product_service.security;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class AuditorAwareImpl implements AuditorAware<String> {
    @Override
    public Optional<String> getCurrentAuditor() {
        String name = "SYSTEM";

        // Null-safe: no authentication exists outside a request (startup
        // seeders, scheduled jobs) — audited rows then record "SYSTEM".
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            name = authentication.getName();
        }

        return Optional.ofNullable(name);
    }
}