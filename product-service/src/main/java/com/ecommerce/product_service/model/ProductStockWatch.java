package com.ecommerce.product_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.util.UUID;

/**
 * A customer asking to be emailed when a sold-out product comes back in
 * stock ("notify me when available"). Keyed on (productId, email); the
 * watch is consumed (deactivated) once the restock alert is queued, so a
 * customer gets exactly one notification per subscription.
 */
@Entity(name = "product_stock_watches")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductStockWatch extends AdvanceBaseModal {

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private boolean active = true;

    /** UI language at subscribe time — localizes the alert email (fallback en). */
    @Column(length = 8)
    private String locale;
}
