package com.ecommerce.user_service.service;

import com.ecommerce.event_bus.dto.EmailRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
@Slf4j
public class EmailConsumer {
    private final EmailService emailService;

    @RabbitListener(queues = "${rabbitmq.queues.send-email}")
    public void sendEmailConsumer(EmailRequest emailRequest) {
        log.info("Consumed email request (attachment={}) from send-email queue",
                emailRequest != null && emailRequest.hasAttachment());
        emailService.sendEmail(emailRequest);
    }
}
