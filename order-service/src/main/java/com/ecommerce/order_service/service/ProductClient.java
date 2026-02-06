package com.ecommerce.order_service.service;
import com.ecommerce.order_service.entity.Order;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.ecommerce.order_service.dto.Product;
import java.util.List;

@FeignClient(name = "product-service")
public interface ProductClient {
    @GetMapping("/products/{id}")
    Product getProductById(@PathVariable Long id);
}