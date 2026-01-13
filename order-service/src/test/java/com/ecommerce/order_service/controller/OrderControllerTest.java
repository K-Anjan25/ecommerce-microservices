package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.entity.Order;
import com.ecommerce.order_service.repository.OrderRepository;
import tools.jackson.databind.json.JsonMapper;
//import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest; 
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJson;
import org.springframework.context.annotation.Import; // Corrected Import
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration; // Corrected Package

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@AutoConfigureJson
@Import(JacksonAutoConfiguration.class) // Explicitly loads the ObjectMapper bean
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OrderRepository orderRepository;

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void shouldCreateOrder() throws Exception {
        Order order = new Order();
        order.setProductName("Laptop");
        order.setQuantity(1);
        order.setPrice(75000);

        Mockito.when(orderRepository.save(Mockito.any(Order.class))).thenReturn(order);

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(order)))
                .andExpect(status().isOk());
    }
}