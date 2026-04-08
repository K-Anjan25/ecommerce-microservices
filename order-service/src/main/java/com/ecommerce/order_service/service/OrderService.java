package com.ecommerce.order_service.service;

import com.ecommerce.order_service.client.InventoryServiceClient;
import com.ecommerce.order_service.dto.Pagination;
import com.ecommerce.order_service.dto.inventory.InventoryCheckRequest;
import com.ecommerce.order_service.dto.inventory.InventoryCheckResponse;
import com.ecommerce.order_service.dto.order.OrderDto;
import com.ecommerce.order_service.dto.order.OrderMapper;
import com.ecommerce.order_service.dto.order.CreateOrderRequest;
import com.ecommerce.order_service.dto.orderItem.CreateOrderItemRequest;
import com.ecommerce.order_service.exception.ProductNotInStockException;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final InventoryServiceClient inventoryServiceClient;
    
    public OrderDto createOrder(CreateOrderRequest createOrderRequest){

        Order order = orderMapper.orderRequestToOrder(createOrderRequest);
        order.getAddress().setOrder(order);
        order.getItems().forEach(item -> item.setOrder(order));

        List<InventoryCheckRequest> inventoryCheckRequests = order.getItems().stream()
                .map(item -> new InventoryCheckRequest(item.getProductId(),item.getQuantity()))
                .collect(Collectors.toList());

        InventoryCheckResponse inventoryCheckResponse = inventoryServiceClient.isInStock(inventoryCheckRequests);

        if(!inventoryCheckResponse.getIsInStock()){
          throw new ProductNotInStockException(inventoryCheckResponse.getIsNotInStockProductIds().toString());
        }
        // TODO:urun siparis olusunca stoktan azalt
        return orderMapper.orderToOrderDto(orderRepository.save(order));
    }

    public Pagination<OrderDto> getAllOrders(int pageNo, int pageSize){
        Pageable paging = PageRequest.of(pageNo, pageSize);
        Page<Order> orders = orderRepository.findAll(paging);
        return new Pagination<>(orders.stream().map(orderMapper::orderToOrderDto).collect(Collectors.toList()),
                orders.getTotalElements());
    }

}