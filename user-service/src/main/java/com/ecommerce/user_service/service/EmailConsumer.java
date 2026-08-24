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
    private final EmailRetryOutboxService retryOutboxService;

    @RabbitListener(queues = "${rabbitmq.queues.send-email}")
    public void sendEmailConsumer(EmailRequest emailRequest) {
        log.info("Consumed email request (attachment={}) from send-email queue",
                emailRequest != null && emailRequest.hasAttachment());
        try {
            emailService.sendEmail(emailRequest);
        } catch (RuntimeException deliveryFailure) {
            try {
                retryOutboxService.enqueue(emailRequest);
                log.warn("Email delivery failed; encrypted retry envelope stored (attachment={})",
                        emailRequest != null && emailRequest.hasAttachment());
            } catch (RuntimeException persistenceFailure) {
                // Do not acknowledge the RabbitMQ message unless durable retry
                // storage succeeded. The broker can redeliver it instead.
                log.error("Email delivery failed and encrypted retry could not be stored; message will be redelivered",
                        persistenceFailure);
                throw persistenceFailure;
            }
        }
    }
}
