package com.ecommerce.product_service.service;

import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.product_service.model.ProductStockWatch;
import com.ecommerce.product_service.repository.ProductStockWatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * "Notify me when back in stock" (Amazon staple). Customers subscribe while
 * a product is sold out; {@code InventoryService} calls
 * {@link #notifyBackInStock} the moment stock crosses from zero back into
 * available. Alerts are one-shot — the watch is consumed after queueing so
 * a customer is never re-emailed for the same subscription.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockWatchService {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final ProductStockWatchRepository stockWatchRepository;
    private final RabbitMQMessageProducer rabbitMQMessageProducer;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email}")
    private String sendEmailRoutingKey;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /** Idempotent subscribe: one active watch per (productId, email). */
    @Transactional
    public void watchProduct(UUID productId, String rawEmail) {
        String email = normalize(rawEmail);
        if (!isValid(email)) {
            throw new IllegalArgumentException("A valid email is required");
        }
        Optional<ProductStockWatch> existing = stockWatchRepository.findByProductIdAndEmail(productId, email);
        if (existing.isPresent()) {
            existing.get().setActive(true);
            stockWatchRepository.save(existing.get());
            return;
        }
        stockWatchRepository.save(ProductStockWatch.builder()
                .productId(productId)
                .email(email)
                .active(true)
                .build());
    }

    @Transactional
    public void unwatchProduct(UUID productId, String rawEmail) {
        String email = normalize(rawEmail);
        stockWatchRepository.deleteByProductIdAndEmail(productId, email);
    }

    public boolean isWatching(UUID productId, String rawEmail) {
        String email = normalize(rawEmail);
        return email != null && stockWatchRepository.findByProductIdAndEmail(productId, email)
                .map(ProductStockWatch::isActive)
                .orElse(false);
    }

    /**
     * Called by {@code InventoryService} when a product's stock crosses from
     * zero (or negative) back into available. Queues one email per active
     * watcher via the notification exchange, then consumes the watches.
     */
    @Transactional
    public void notifyBackInStock(UUID productId, String productName) {
        List<ProductStockWatch> watches = stockWatchRepository.findByProductIdAndActiveTrue(productId);
        if (watches.isEmpty()) {
            return;
        }
        String subject = "CARTLY - Back in stock: " + productName;
        String productUrl = frontendUrl + "/products/" + productId;
        for (ProductStockWatch watch : watches) {
            String text = "Good news — something on your watchlist is back!\n\n"
                    + productName + " is available again.\n\n"
                    + "It sold out fast last time — grab it here: " + productUrl;
            try {
                rabbitMQMessageProducer.publish(
                        new EmailRequest(text, watch.getEmail(), subject),
                        notificationExchange,
                        sendEmailRoutingKey);
                watch.setActive(false);
                stockWatchRepository.save(watch);
            } catch (Exception e) {
                // One failing publish must not block the remaining alerts —
                // that watch stays active and can fire on the next restock.
                log.error("Failed to queue back-in-stock email to {} for product {}",
                        watch.getEmail(), productId, e);
            }
        }
        log.info("Queued {} back-in-stock alerts for product {}", watches.size(), productId);
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private boolean isValid(String email) {
        return email != null && EMAIL.matcher(email).matches();
    }
}
