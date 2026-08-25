package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity(name = "loyalty_points")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LoyaltyPoint extends AdvanceBaseModal {

    private UUID customerId;

    private Integer points;

    private String description;

    @Enumerated(EnumType.STRING)
    private LoyaltyPointType type;

    @Column(precision = 19, scale = 2)
    private BigDecimal amount;
}
