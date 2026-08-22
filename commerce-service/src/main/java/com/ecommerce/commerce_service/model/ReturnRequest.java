package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity(name = "returnRequests")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ReturnRequest extends AdvanceBaseModal {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    private UUID id;

    private UUID orderId;
    private UUID customerId;
    private UUID productId;
    private String variantId;
    private int quantity;

    @Enumerated(EnumType.STRING)
    private ReturnStatus status;

    @Column(precision = 19, scale = 2)
    private BigDecimal refundAmount;

    private String reason;
    private String rejectionReason;
}
