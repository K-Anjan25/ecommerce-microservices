// package com.ecommerce.order_service.controller;

// import com.ecommerce.order_service.entity.Order;
// // import com.ecommerce.order_service.dto.OrderRequest;
// // import io.swagger.v3.oas.annotations.Operation;
// // import io.swagger.v3.oas.annotations.tags.Tag;
// import com.ecommerce.order_service.service.OrderService;
// import org.springframework.beans.factory.annotation.Autowired;
// import jakarta.validation.Valid;
// import com.ecommerce.order_service.repository.OrderRepository;
// import org.springframework.web.bind.annotation.*;
// import com.ecommerce.order_service.exception.OrderNotFoundException;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.web.PageableDefault;


// import java.util.List;

// @RestController
// @RequestMapping("/orders")
// // @Tag(name = "Order API", description = "APIs for managing orders")
// public class OrderController {

//     @Autowired
//     private OrderService orderService;

//     @GetMapping
//     public List<Order> getAllOrders() {
//         return orderService.getAllOrders();
//     }

//     @GetMapping("/{id}")
//     public Order getOrderById(@PathVariable Long id) {
//         return orderService.getOrderById(id);
//     }

//     @PostMapping
//     public Order addOrder(@RequestBody Order order) {
//         return orderService.addOrder(order);
//     }



// }

package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.dto.Pagination;
import com.ecommerce.order_service.dto.order.OrderDto;
import com.ecommerce.order_service.dto.order.CreateOrderRequest;
import com.ecommerce.order_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

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

}