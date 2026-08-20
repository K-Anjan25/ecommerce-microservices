package com.ecommerce.product_service.inventory.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.List;
import java.util.UUID;

@Builder
@Getter
@ToString
public class InventoryCheckResponse {
    private List<UUID> isNotInStockProductIds;
    private Boolean isInStock;
}
