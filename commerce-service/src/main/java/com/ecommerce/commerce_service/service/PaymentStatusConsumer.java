package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.payment.PaymentStatusEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentStatusConsumer {

    private final OrderService orderService;

    @RabbitListener(queues = "${rabbitmq.queues.payment-status}")
    public void consume(PaymentStatusEvent event) {
        log.info("Consumed payment event for order {}, status {}", event.getOrderId(), event.getStatus());
        orderService.applyPaymentStatus(event.getOrderId(), event.getStatus());
    }
}
