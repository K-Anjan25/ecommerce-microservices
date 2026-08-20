package com.ecommerce.commerce_service.model;

import lombok.*;

import javax.persistence.Embeddable;
import java.math.BigDecimal;
import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    private UUID productId;
    private String name;
    private BigDecimal price;
    private BigDecimal totalPrice;
    private Integer quantity;
}
