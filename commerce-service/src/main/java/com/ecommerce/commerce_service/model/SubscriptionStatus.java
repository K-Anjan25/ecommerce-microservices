package com.ecommerce.commerce_service.model;

/**
 * Subscribe &amp; Save lifecycle. CANCELED is a soft state — history is kept
 * (Amazon keeps cancelled subscriptions visible to the customer).
 */
public enum SubscriptionStatus {
    ACTIVE,
    PAUSED,
    CANCELED
}
