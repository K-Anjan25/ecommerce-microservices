package com.ecommerce.product_service.service;

import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.product_service.model.ProductPriceWatch;
import com.ecommerce.product_service.repository.ProductPriceWatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceWatchService {

    private final ProductPriceWatchRepository priceWatchRepository;
    private final RabbitMQMessageProducer rabbitMQMessageProducer;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email}")
    private String sendEmailRoutingKey;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /** Idempotent subscribe: one active watch per (productId, email). */
    public void watchProduct(UUID productId, String rawEmail) {
        String email = normalize(rawEmail);
        if (!isValid(email)) {
            throw new IllegalArgumentException("A valid email is required");
        }
        Optional<ProductPriceWatch> existing = priceWatchRepository.findByProductIdAndEmail(productId, email);
        if (existing.isPresent()) {
            existing.get().setActive(true);
            priceWatchRepository.save(existing.get());
            return;
        }
        priceWatchRepository.save(ProductPriceWatch.builder()
                .productId(productId)
                .email(email)
                .active(true)
                .build());
    }

    public void unwatchProduct(UUID productId, String rawEmail) {
        String email = normalize(rawEmail);
        priceWatchRepository.deleteByProductIdAndEmail(productId, email);
    }

    public boolean isWatching(UUID productId, String rawEmail) {
        String email = normalize(rawEmail);
        return email != null && priceWatchRepository.findByProductIdAndEmail(productId, email)
                .map(ProductPriceWatch::isActive)
                .orElse(false);
    }

    /** Called by ProductService when a product's unit price decreases. */
    public void notifyPriceDrop(UUID productId, String productName, BigDecimal oldPrice, BigDecimal newPrice) {
        if (newPrice == null || oldPrice == null || newPrice.compareTo(oldPrice) >= 0) {
            return;
        }
        List<ProductPriceWatch> watches = priceWatchRepository.findByProductIdAndActiveTrue(productId);
        if (watches.isEmpty()) {
            return;
        }
        long percentOff = oldPrice.subtract(newPrice)
                .multiply(BigDecimal.valueOf(100))
                .divide(oldPrice, 0, RoundingMode.HALF_UP)
                .longValueExact();
        String subject = "CARTLY - Price drop: " + productName;
        for (ProductPriceWatch watch : watches) {
            String text = "Good news — a product on your watchlist just got cheaper!\n\n"
                    + productName + "\n"
                    + "Was: Rs. " + oldPrice + "\n"
                    + "Now: Rs. " + newPrice + " (" + percentOff + "% off)\n\n"
                    + "View it here: " + frontendUrl + "/products/" + productId;
            try {
                rabbitMQMessageProducer.publish(
                        new EmailRequest(text, watch.getEmail(), subject),
                        notificationExchange,
                        sendEmailRoutingKey);
            } catch (Exception e) {
                // One failing publish must not block the remaining alerts.
                log.error("Failed to queue price-drop email to {} for product {}", watch.getEmail(), productId, e);
            }
        }
        log.info("Queued {} price-drop alerts for product {} ({} -> {})", watches.size(), productId, oldPrice, newPrice);
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private boolean isValid(String email) {
        return email != null && email.contains("@") && email.length() > 3 && !email.isBlank();
    }
}
