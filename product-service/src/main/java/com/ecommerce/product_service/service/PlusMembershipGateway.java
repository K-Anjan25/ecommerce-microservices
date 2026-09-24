package com.ecommerce.product_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cartly Plus membership lookup against commerce-service (shared internal
 * secret), used to gate the 24-hour flash-sale early-access window. Results
 * are memoised briefly so catalog mapping never hammers commerce-service; an
 * outage degrades to "not a member" (public windows only), never blocks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlusMembershipGateway {

    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${commerce-service.url:http://localhost:8081}")
    private String commerceServiceUrl;

    @Value("${internal-service.secret:cartly-internal-dev-only}")
    private String internalSecret;

    private static final long CACHE_TTL_MS = 60_000L;

    private static final class CacheEntry {
        final boolean active;
        final long fetchedAtMs;

        CacheEntry(boolean active, long fetchedAtMs) {
            this.active = active;
            this.fetchedAtMs = fetchedAtMs;
        }
    }

    private final Map<UUID, CacheEntry> cache = new ConcurrentHashMap<>();

    /** True when the authenticated user holds a live Cartly Plus membership. */
    public boolean isCurrentUserPlus() {
        UUID userId = currentUserId();
        return userId != null && isPlus(userId);
    }

    public boolean isPlus(UUID userId) {
        if (userId == null) return false;
        long nowMs = System.currentTimeMillis();
        CacheEntry entry = cache.get(userId);
        if (entry != null && nowMs - entry.fetchedAtMs < CACHE_TTL_MS) {
            return entry.active;
        }
        boolean active = fetch(userId);
        cache.put(userId, new CacheEntry(active, nowMs));
        return active;
    }

    private boolean fetch(UUID userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Service", internalSecret);
            ResponseEntity<Map> response = restTemplateBuilder.build().exchange(
                    commerceServiceUrl + "/internal/memberships/active/{userId}",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class,
                    userId.toString());
            Object active = response.getBody() == null ? null : response.getBody().get("active");
            return Boolean.TRUE.equals(active);
        } catch (Exception e) {
            log.warn("Cartly Plus lookup failed for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    /** The gateway injects the validated user id as the principal. */
    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        try {
            return UUID.fromString(String.valueOf(authentication.getPrincipal()));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
