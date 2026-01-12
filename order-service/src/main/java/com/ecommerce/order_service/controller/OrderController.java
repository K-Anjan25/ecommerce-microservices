package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.entity.Order;
import com.ecommerce.order_service.dto.OrderRequest;
import jakarta.validation.Valid;
import com.ecommerce.order_service.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;
import com.ecommerce.order_service.exception.OrderNotFoundException;


import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // POST: Save Order
    @PostMapping
    public Order createOrder(@Valid @RequestBody OrderRequest orderRequest) {
        Order order = new Order();
        order.setProductName(orderRequest.getProductName());
        order.setQuantity(orderRequest.getQuantity());
        order.setPrice(orderRequest.getPrice());

        return orderRepository.save(order);
    }


    // GET: Fetch all Orders
    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Long id) {
    return orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }


    // GET: Test endpoint
    @GetMapping("/test")
    public String test() {
        return "Order Service GET & POST API working";
    }

    @PutMapping("/{id}")
    public Order updateOrder(
        @PathVariable Long id,
        @Valid @RequestBody OrderRequest orderRequest) {

        Order existingOrder = orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));

        existingOrder.setProductName(orderRequest.getProductName());
        existingOrder.setQuantity(orderRequest.getQuantity());
        existingOrder.setPrice(orderRequest.getPrice());

        return orderRepository.save(existingOrder);
    }

    @DeleteMapping("/{id}")
    public String deleteOrder(@PathVariable Long id) {
        Order existingOrder = orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));

        orderRepository.delete(existingOrder);
        return "Order deleted with id: " + id;
    }

}
