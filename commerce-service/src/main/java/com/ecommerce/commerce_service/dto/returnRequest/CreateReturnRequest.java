package com.ecommerce.commerce_service.dto.returnRequest;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
@Setter
public class CreateReturnRequest {
    @NotNull
    private UUID orderId;
    @NotNull
    private UUID productId;
    private String variantId;
    @Min(1)
    private int quantity;
    private String reason;
}
