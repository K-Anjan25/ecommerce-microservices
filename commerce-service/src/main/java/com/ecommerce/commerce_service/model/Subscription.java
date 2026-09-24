package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Auto-reorder subscription ("Subscribe & Save"). Every {@code intervalDays}
 * the scheduler places an order for the customer, priced at that day's catalog
 * price minus the subscription discount (5% base, 15% when 5+ deliveries batch
 * in one calendar month). Payment is hybrid: a saved payment method is charged
 * automatically; without one the order waits for manual payment.
 */
@Entity(name = "subscriptions")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(callSuper = false)
@SuperBuilder
public class Subscription extends AdvanceBaseModal {

    private UUID customerId;

    private UUID productId;

    /** Snapshot at subscribe time; refreshed by the scheduler on each run. */
    private String productName;

    /** Optional variant (colourway/config) being subscribed to. */
    private UUID variantId;

    private String variantName;

    /** Unit price charged on the most recent auto-order (before discount). */
    private BigDecimal unitPrice;

    private Integer quantity;

    private Integer intervalDays;

    /** When the next auto-delivery is due (order placement date). */
    private LocalDateTime nextRunAt;

    /** Kept in sync with {@link #status} for the original column. */
    private boolean active;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SubscriptionStatus status;

    /** Discount percentage applied to the ship-day catalog price (5 or 15). */
    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercent;

    /** When set (and in the future), deliveries resume after this timestamp. */
    private LocalDateTime pausedUntil;

    /** Customer asked to skip the upcoming delivery once. */
    private boolean skipNext;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private SubscriptionOosPolicy oosPolicy;

    /** Set when the pre-delivery reminder email fired for the current cycle. */
    private LocalDateTime reminderSentAt;

    private UUID lastOrderId;
}
