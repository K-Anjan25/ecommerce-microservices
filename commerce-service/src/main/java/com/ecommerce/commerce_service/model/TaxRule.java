package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity(name = "tax_rules")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TaxRule extends AdvanceBaseModal {

    @Column(unique = true, nullable = false, length = 100)
    private String state;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal rate;

    @Column(length = 50, nullable = false)
    private String taxName;

    @Column(length = 20)
    private String code;

    @Column(nullable = false)
    private boolean active = true;
}
