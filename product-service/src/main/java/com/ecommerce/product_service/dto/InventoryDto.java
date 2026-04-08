package com.ecommerce.product_service.dto;

import lombok.*;

import java.util.UUID;


@AllArgsConstructor
@Data
@NoArgsConstructor
public class InventoryDto {
    private UUID productId;
    private Integer quantity;
}