package com.ecommerce.commerce_service.membership;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Cartly Plus membership lifecycle. Prices are fixed server-side only.
 * Benefits (free express delivery, boosted Subscribe & Save, member-only
 * prices, 24h flash early access, priority support) read {@link #isPlusActive}.
 */
@Service
@RequiredArgsConstructor
public class MembershipService {

    public static final String PLAN_MONTHLY = "MONTHLY";
    public static final String PLAN_ANNUAL = "ANNUAL";
    /** Server-side pricing — never accepted from clients. */
    public static final BigDecimal PRICE_MONTHLY = new BigDecimal("149.00");
    public static final BigDecimal PRICE_ANNUAL = new BigDecimal("1499.00");

    private final CartlyPlusMembershipRepository repository;

    public static BigDecimal priceFor(String plan) {
        if (PLAN_MONTHLY.equals(plan)) return PRICE_MONTHLY;
        if (PLAN_ANNUAL.equals(plan)) return PRICE_ANNUAL;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown Cartly Plus plan: " + plan);
    }

    /** Join, or renew an expired membership into a fresh period. */
    @Transactional
    public MembershipStatusDto join(UUID userId, String plan) {
        BigDecimal price = priceFor(plan);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime periodEnd = PLAN_ANNUAL.equals(plan) ? now.plusYears(1) : now.plusMonths(1);

        CartlyPlusMembership membership = repository.findByUserId(userId)
                .orElseGet(() -> CartlyPlusMembership.builder().userId(userId).startedAt(now).build());
        // A live membership simply renews its period (paid-up extension).
        if ("ACTIVE".equals(membership.getStatus())
                && membership.getCurrentPeriodEnd() != null
                && membership.getCurrentPeriodEnd().isAfter(now)) {
            periodEnd = membership.getPlan() == null || membership.getPlan().equals(plan)
                    ? membership.getCurrentPeriodEnd().plusMonths(PLAN_ANNUAL.equals(plan) ? 12 : 1)
                    : periodEnd.plus(PLAN_ANNUAL.equals(plan) ? java.time.Period.ofYears(1) : java.time.Period.ofMonths(1));
        }
        membership.setStatus("ACTIVE");
        membership.setPlan(plan);
        membership.setPricePaid(price);
        membership.setCurrentPeriodEnd(periodEnd);
        membership.setAutoRenew(true);
        membership.setUpdatedAt(now);
        if (membership.getStartedAt() == null) membership.setStartedAt(now);
        return toStatus(repository.save(membership));
    }

    /** Keep benefits until period end, then stop renewing (Prime-style). */
    @Transactional
    public MembershipStatusDto cancel(UUID userId) {
        CartlyPlusMembership membership = require(userId);
        membership.setAutoRenew(false);
        membership.setUpdatedAt(LocalDateTime.now());
        return toStatus(repository.save(membership));
    }

    @Transactional
    public MembershipStatusDto setAutoRenew(UUID userId, boolean enabled) {
        CartlyPlusMembership membership = require(userId);
        membership.setAutoRenew(enabled);
        membership.setUpdatedAt(LocalDateTime.now());
        return toStatus(repository.save(membership));
    }

    public MembershipStatusDto status(UUID userId) {
        CartlyPlusMembership membership = repository.findByUserId(userId).orElse(null);
        if (membership == null) {
            return new MembershipStatusDto("NONE", null, null, null, null, false, userId);
        }
        expireIfNeeded(membership);
        return toStatus(membership);
    }

    /** The benefit gate used by orders, shipping, subscriptions and support. */
    public boolean isPlusActive(UUID userId) {
        if (userId == null) return false;
        CartlyPlusMembership membership = repository.findByUserId(userId).orElse(null);
        if (membership == null) return false;
        expireIfNeeded(membership);
        return "ACTIVE".equals(membership.getStatus())
                && membership.getCurrentPeriodEnd() != null
                && membership.getCurrentPeriodEnd().isAfter(LocalDateTime.now());
    }

    private void expireIfNeeded(CartlyPlusMembership membership) {
        if ("ACTIVE".equals(membership.getStatus())
                && membership.getCurrentPeriodEnd() != null
                && !membership.getCurrentPeriodEnd().isAfter(LocalDateTime.now())) {
            membership.setStatus("EXPIRED");
            membership.setUpdatedAt(LocalDateTime.now());
            repository.save(membership);
        }
    }

    private CartlyPlusMembership require(UUID userId) {
        return repository.findByUserId(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "No Cartly Plus membership found"));
    }

    private MembershipStatusDto toStatus(CartlyPlusMembership membership) {
        return new MembershipStatusDto(
                membership.getStatus(),
                membership.getPlan(),
                membership.getPricePaid(),
                membership.getStartedAt(),
                membership.getCurrentPeriodEnd(),
                membership.isAutoRenew(),
                membership.getUserId());
    }
}
