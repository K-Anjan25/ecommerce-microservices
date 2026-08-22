package com.ecommerce.commerce_service.dto.returnRequest;

import com.ecommerce.commerce_service.model.ReturnStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReturnRequestDto {
    private UUID id;
    private UUID orderId;
    private UUID customerId;
    private UUID productId;
    private String variantId;
    private int quantity;
    private ReturnStatus status;
    private BigDecimal refundAmount;
    private String refundTransactionId;
    private String reason;
    private String rejectionReason;
}
