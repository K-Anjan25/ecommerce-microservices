package com.ecommerce.inventory_service.dto;

import com.ecommerce.event_bus.dto.InventoryRequest;
import com.ecommerce.inventory_service.model.Inventory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InventoryMapper {
    public Inventory createInventoryRequestToInventory(InventoryRequest inventoryRequest){
        return Inventory.builder()
                .productId(inventoryRequest.getProductId())
                .quantity(inventoryRequest.getQuantity())
                .build();
    }

}