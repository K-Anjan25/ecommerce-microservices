package com.ecommerce.order_service.service;

import com.ecommerce.order_service.entity.Order;
import com.ecommerce.order_service.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ecommerce.order_service.service.ProductClient;
import com.ecommerce.order_service.dto.Product;
import java.util.List;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductClient productClient;


    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public Order addOrder(Order order) {
        // Fetch product details from product service
        Product product = productClient.getProductById(order.getId());
        if (product != null) {
            return orderRepository.save(order);
        } else {
            throw new RuntimeException("Product not found");
        }
    }
}