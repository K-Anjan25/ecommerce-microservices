package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.entity.Order;
// import com.ecommerce.order_service.dto.OrderRequest;
// import io.swagger.v3.oas.annotations.Operation;
// import io.swagger.v3.oas.annotations.tags.Tag;
import com.ecommerce.order_service.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import com.ecommerce.order_service.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;
import com.ecommerce.order_service.exception.OrderNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;


import java.util.List;

@RestController
@RequestMapping("/orders")
// @Tag(name = "Order API", description = "APIs for managing orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @PostMapping
    public Order addOrder(@RequestBody Order order) {
        return orderService.addOrder(order);
    }



}