package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

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

    private UUID orderId;
    private UUID customerId;
    private UUID productId;
    private String variantId;
    private int quantity;

    @Enumerated(EnumType.STRING)
    private ReturnStatus status;

    @Column(precision = 19, scale = 2)
    private BigDecimal refundAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal giftCardRefundAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal providerRefundAmount;

    /** Provider reference for the executed refund (e.g. razorpay refund id). */
    private String refundTransactionId;

    private String reason;
    private String rejectionReason;
}
