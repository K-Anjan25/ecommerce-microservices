package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * International delivery zone. A zone covers a comma-separated list of
 * ISO-3166 alpha-2 country codes and carries the flat shipping cost plus the
 * import duty/VAT rate applied to international orders (INR billing).
 */
@Entity(name = "shipping_zones")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ShippingZone extends AdvanceBaseModal {

    @Column(unique = true, nullable = false, length = 80)
    private String name;

    /** Comma-separated ISO-3166 alpha-2 codes, e.g. "US,GB,AE". */
    @Column(nullable = false, length = 500)
    private String countries;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal cost;

    @Column(precision = 19, scale = 2)
    private BigDecimal freeAbove;

    @Column(nullable = false)
    private int estimatedDaysMin;

    @Column(nullable = false)
    private int estimatedDaysMax;

    @Column(length = 50)
    private String carrier;

    /** Import duty + VAT rate applied to the taxable amount, e.g. 0.15. */
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal dutyRate;

    /** Label shown to customers, e.g. "Import duty & VAT". */
    @Column(length = 60, nullable = false)
    private String dutyName;

    @Column(nullable = false)
    private boolean active = true;
}
