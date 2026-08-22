package com.ecommerce.commerce_service.client;

import com.ecommerce.commerce_service.dto.catalog.ProductSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Read-only catalog lookups against product-service (best-effort; used for
 * invoice labels). Separate Feign name from InventoryServiceClient on purpose.
 */
@FeignClient(
        name = "product-catalog-service",
        url = "${product-service.url}",
        path = "/v1/products"
)
public interface ProductCatalogClient {

    @GetMapping("/findByIds/{productIds}")
    List<ProductSummaryDto> findByIds(@PathVariable("productIds") String productIds);
}
