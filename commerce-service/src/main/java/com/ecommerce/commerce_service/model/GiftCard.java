package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity(name = "gift_cards")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class GiftCard extends AdvanceBaseModal {

    private String code;

    @Column(precision = 19, scale = 2)
    private BigDecimal balance;

    @Column(precision = 19, scale = 2)
    private BigDecimal initialBalance;

    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    private GiftCardStatus status;

    private UUID purchasedBy;

    private String recipientEmail;
}
