package com.ecommerce.commerce_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQCommerceConfig {

    @Value("${rabbitmq.exchanges.internal}")
    private String internalExchange;

    @Value("${rabbitmq.queues.payment-status}")
    private String paymentStatusQueue;

    @Value("${rabbitmq.routing-keys.payment-status}")
    private String paymentStatusRoutingKey;

    @Bean
    public TopicExchange orderTopicExchange() {
        return new TopicExchange(internalExchange);
    }

    @Bean
    public Queue paymentStatusQueue() {
        return new Queue(paymentStatusQueue);
    }

    @Bean
    public Binding paymentStatusBinding() {
        return BindingBuilder.bind(paymentStatusQueue()).to(orderTopicExchange()).with(paymentStatusRoutingKey);
    }
}
