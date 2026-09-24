package com.ecommerce.commerce_service.model;

/**
 * What the auto-reorder scheduler does when the item is out of stock on the
 * scheduled run.
 */
public enum SubscriptionOosPolicy {
    /** Skip this delivery, schedule the next one (Amazon default). */
    SKIP,
    /** Wait and retry the next day until stock arrives. */
    WAIT,
    /** Cancel the subscription and tell the customer. */
    CANCEL
}
