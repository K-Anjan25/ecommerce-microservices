package com.ecommerce.commerce_service.dto.returnRequest;

import lombok.Getter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
public class CreateReturnRequest {
    @NotNull
    private UUID orderId;
    @NotNull
    private UUID productId;
    private String variantId;
    @Min(1)
    private int quantity;
    private String reason;
    private UUID customerId;
}
