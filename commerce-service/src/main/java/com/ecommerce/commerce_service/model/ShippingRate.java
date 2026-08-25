package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity(name = "shipping_rates")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ShippingRate extends AdvanceBaseModal {

    @Column(unique = true, nullable = false)
    private String pincode;

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

    @Column(nullable = false)
    private boolean active = true;
}
