package com.ecommerce.commerce_service.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class DeductStockRequest {
    private UUID productId;
    private Integer quantity;
    private UUID variantId;
}
