package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.Pagination;
import com.ecommerce.commerce_service.dto.order.OrderDto;
import com.ecommerce.commerce_service.dto.order.CreateOrderRequest;
import com.ecommerce.commerce_service.dto.tracking.OrderStatusHistoryDto;
import com.ecommerce.commerce_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@Valid @RequestBody CreateOrderRequest createOrderRequest){
        log.info("create order request was called");
        return new ResponseEntity<>(orderService.createOrder(createOrderRequest),HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Pagination<OrderDto>> getAll(@RequestParam(required = false,defaultValue = "0")  int pageNo,
                                                       @RequestParam(required = false,defaultValue = "10") int pageSize){
        return ResponseEntity.ok(orderService.getAllOrders(pageNo,pageSize));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDto> getById(@PathVariable UUID orderId){
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @GetMapping("/{orderId}/track")
    public ResponseEntity<List<OrderStatusHistoryDto>> trackOrder(@PathVariable UUID orderId){
        return ResponseEntity.ok(orderService.getOrderTracking(orderId));
    }

}
