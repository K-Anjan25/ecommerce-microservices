package com.ecommerce.product_service.inventory.controller;

import com.ecommerce.product_service.inventory.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class InventoryControllerTest {
    @Test
    void rejectsMissingInternalCredential() {
        InventoryService inventory = mock(InventoryService.class);
        InventoryController controller = new InventoryController(inventory);
        ReflectionTestUtils.setField(controller, "internalSecret", "expected-secret");

        assertThatThrownBy(() -> controller.deductStock(null, List.of()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("401");
    }

    @Test
    void acceptsMatchingInternalCredential() {
        InventoryService inventory = mock(InventoryService.class);
        InventoryController controller = new InventoryController(inventory);
        ReflectionTestUtils.setField(controller, "internalSecret", "expected-secret");

        controller.restoreStock("expected-secret", List.of());

        verify(inventory).restoreStock(List.of());
    }
}
