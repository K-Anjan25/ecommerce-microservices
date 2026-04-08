package com.ecommerce.event_bus.dto;

import java.util.UUID;

public class DeleteInventoryRequest {
    private UUID productId;

    public DeleteInventoryRequest(UUID productId) {
        this.productId = productId;
    }

    public DeleteInventoryRequest(){

    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

}