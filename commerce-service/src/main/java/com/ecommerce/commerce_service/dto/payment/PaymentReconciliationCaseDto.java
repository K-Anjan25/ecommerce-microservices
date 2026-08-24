package com.ecommerce.commerce_service.dto.payment;

import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Safe operations projection; provider credentials and customer capabilities are never exposed. */
@Value
@Builder
public class PaymentReconciliationCaseDto {
    UUID id;
    Long paymentId;
    UUID orderId;
    String provider;
    String transactionId;
    BigDecimal amount;
    String currency;
    String status;
    String reason;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime resolvedAt;

    public static PaymentReconciliationCaseDto from(PaymentReconciliationCase item) {
        return PaymentReconciliationCaseDto.builder()
                .id(item.getId())
                .paymentId(item.getPaymentId())
                .orderId(item.getOrderId())
                .provider(item.getProvider() == null ? null : item.getProvider().name())
                .transactionId(item.getTransactionId())
                .amount(item.getAmount())
                .currency(item.getCurrency())
                .status(item.getStatus())
                .reason(item.getReason())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .resolvedAt(item.getResolvedAt())
                .build();
    }
}
