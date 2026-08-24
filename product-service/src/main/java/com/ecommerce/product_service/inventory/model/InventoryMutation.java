package com.ecommerce.product_service.inventory.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.time.LocalDateTime;

/** Durable idempotency claim for a stock mutation requested by commerce. */
@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMutation {
    @Id
    @Column(length = 100)
    private String operationId;

    @Column(nullable = false, length = 16)
    private String operationType;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
