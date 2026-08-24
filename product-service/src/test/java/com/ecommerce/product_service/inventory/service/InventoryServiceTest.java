package com.ecommerce.product_service.inventory.service;

import com.ecommerce.product_service.inventory.dto.DeductStockRequest;
import com.ecommerce.product_service.inventory.model.Inventory;
import com.ecommerce.product_service.inventory.repository.InventoryRepository;
import com.ecommerce.product_service.repository.ProductVariantRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class InventoryServiceTest {
    @Test
    void deductsUnderWriteLockWithoutClamping() {
        InventoryRepository repository = mock(InventoryRepository.class);
        Inventory stock = Inventory.builder().productId(UUID.randomUUID()).quantity(5).build();
        when(repository.findLockedByProductId(stock.getProductId())).thenReturn(stock);
        InventoryService service = new InventoryService(repository, mock(ProductVariantRepository.class));

        service.deductStock(List.of(new DeductStockRequest(stock.getProductId(), 3, null)));

        assertThat(stock.getQuantity()).isEqualTo(2);
        verify(repository).save(stock);
    }

    @Test
    void rejectsConcurrentOversellInsteadOfClampingToZero() {
        InventoryRepository repository = mock(InventoryRepository.class);
        Inventory stock = Inventory.builder().productId(UUID.randomUUID()).quantity(2).build();
        when(repository.findLockedByProductId(stock.getProductId())).thenReturn(stock);
        InventoryService service = new InventoryService(repository, mock(ProductVariantRepository.class));

        assertThatThrownBy(() -> service.deductStock(
                List.of(new DeductStockRequest(stock.getProductId(), 3, null))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insufficient stock");
        assertThat(stock.getQuantity()).isEqualTo(2);
        verify(repository, never()).save(any());
    }
}
