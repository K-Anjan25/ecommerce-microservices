package com.ecommerce.commerce_service.dto.tracking;

import com.ecommerce.commerce_service.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryDto {
    private UUID id;
    private UUID orderId;
    private OrderStatus status;
    private String note;
    private LocalDateTime changedAt;
}