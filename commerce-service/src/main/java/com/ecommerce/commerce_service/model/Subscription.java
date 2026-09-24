package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Auto-reorder subscription ("Subscribe & Save"). Every {@code intervalDays}
 * the scheduler places a PENDING order for the customer using their most
 * recent delivery address; the customer pays from the Orders page.
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

    private BigDecimal unitPrice;

    private Integer quantity;

    private Integer intervalDays;

    private LocalDateTime nextRunAt;

    private boolean active;

    private UUID lastOrderId;
}
