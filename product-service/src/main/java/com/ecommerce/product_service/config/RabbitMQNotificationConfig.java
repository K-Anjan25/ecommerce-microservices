package com.ecommerce.product_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares the notification exchange + send-email queue/binding so price-drop
 * alerts can be published even if user-service has not booted yet (RabbitMQ
 * declarations are idempotent — user-service declares the same topology).
 */
@Configuration
public class RabbitMQNotificationConfig {

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.queues.send-email}")
    private String sendEmailQueue;

    @Value("${rabbitmq.routing-keys.send-email}")
    private String sendEmailRoutingKey;

    @Bean
    public TopicExchange notificationTopicExchange() {
        return new TopicExchange(notificationExchange);
    }

    @Bean
    public Queue sendEmailQueue() {
        return new Queue(sendEmailQueue);
    }

    @Bean
    public Binding sendEmailBinding() {
        return BindingBuilder.bind(sendEmailQueue())
                .to(notificationTopicExchange())
                .with(sendEmailRoutingKey);
    }
}
