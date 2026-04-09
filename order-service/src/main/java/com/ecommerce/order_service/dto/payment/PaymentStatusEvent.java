package com.ecommerce.order_service.dto.payment;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class PaymentStatusEvent {
    private UUID orderId;
    private String status;
    private String provider;
    private String transactionId;
}
