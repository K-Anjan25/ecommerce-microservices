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
    public void watchProduct(UUID productId, String rawEmail, String rawLocale) {
        String email = normalize(rawEmail);
        if (!isValid(email)) {
            throw new IllegalArgumentException("A valid email is required");
        }
        String locale = normalizeLocale(rawLocale);
        Optional<ProductPriceWatch> existing = priceWatchRepository.findByProductIdAndEmail(productId, email);
        if (existing.isPresent()) {
            existing.get().setActive(true);
            existing.get().setLocale(locale);
            priceWatchRepository.save(existing.get());
            return;
        }
        priceWatchRepository.save(ProductPriceWatch.builder()
                .productId(productId)
                .email(email)
                .locale(locale)
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
        for (ProductPriceWatch watch : watches) {
            String locale = watch.getLocale();
            String subject = "CARTLY - " + priceDropSubject(locale, productName);
            String text = priceDropGreeting(locale) + "\n\n" + productName + "\n"
                    + priceWasLabel(locale) + " Rs. " + oldPrice + "\n"
                    + priceNowLabel(locale) + " Rs. " + newPrice + " (" + percentOff + "% off)\n\n"
                    + priceViewLabel(locale) + " " + frontendUrl + "/products/" + productId;
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

    static String normalizeLocale(String locale) {
        if (locale == null || locale.isBlank()) return "en";
        String code = locale.trim().toLowerCase().split("[-_]", 2)[0];
        switch (code) {
            case "hi": case "de": case "fr": case "nl": case "es":
            case "sv": case "ar": case "ja": case "ko":
                return code;
            default: return "en";
        }
    }

    static String priceDropSubject(String locale, String productName) {
        String l = normalizeLocale(locale);
        switch (l) {
            case "hi": return "कीमत गिरी: " + productName;
            case "de": return "Preissturz: " + productName;
            case "fr": return "Baisse de prix : " + productName;
            case "nl": return "Prijsdaling: " + productName;
            case "es": return "Bajada de precio: " + productName;
            case "sv": return "Prisfall: " + productName;
            case "ar": return "انخفاض السعر: " + productName;
            case "ja": return "価格低下: " + productName;
            case "ko": return "가격 인하: " + productName;
            default: return "Price drop: " + productName;
        }
    }

    static String priceDropGreeting(String locale) {
        switch (normalizeLocale(locale)) {
            case "hi": return "अच्छी खबर — आपकी वॉचलिस्ट के उत्पाद की कीमत अब कम हो गई है!";
            case "de": return "Gute Nachricht — ein Produkt auf Ihrer Merkliste ist gerade g\u00fcnstiger geworden!";
            case "fr": return "Bonne nouvelle — un produit de votre liste vient de baisser !";
            case "nl": return "Goed nieuws — een product op je verlanglijst is net goedkoper geworden!";
            case "es": return "Buenas noticias: \u00a1un producto de tu lista acaba de bajar de precio!";
            case "sv": return "Bra nyheter — en produkt p\u00e5 din \u00f6nskelista blev precis billigare!";
            case "ar": return "خبر سار — انخفض سعر أحد منتجات قائمتك للتو!";
            case "ja": return "お知らせ — ウォッチリストの商品が値下がりしました！";
            case "ko": return "소식 — 위시리스트의 상품 가격이 내려갔습니다!";
            default: return "Good news — a product on your watchlist just got cheaper!";
        }
    }

    static String priceWasLabel(String locale) {
        switch (normalizeLocale(locale)) {
            case "hi": return "पहले:";
            case "de": return "Vorher:";
            case "fr": return "Avant :";
            case "nl": return "Eerst:";
            case "es": return "Antes:";
            case "sv": return "F\u00f6rr:";
            case "ar": return "سابقاً:";
            case "ja": return "以前:";
            case "ko": return "이전:";
            default: return "Was:";
        }
    }

    static String priceNowLabel(String locale) {
        switch (normalizeLocale(locale)) {
            case "hi": return "अब:";
            case "de": return "Jetzt:";
            case "fr": return "Maintenant :";
            case "nl": return "Nu:";
            case "es": return "Ahora:";
            case "sv": return "Nu:";
            case "ar": return "الآن:";
            case "ja": return "現在:";
            case "ko": return "현재:";
            default: return "Now:";
        }
    }

    static String priceViewLabel(String locale) {
        switch (normalizeLocale(locale)) {
            case "hi": return "यहाँ देखें:";
            case "de": return "Hier ansehen:";
            case "fr": return "Voir ici :";
            case "nl": return "Bekijk hier:";
            case "es": return "Verlo aquí:";
            case "sv": return "Se här:";
            case "ar": return "عرض هنا:";
            case "ja": return "こちらで見る:";
            case "ko": return "여기에서 보기:";
            default: return "View it here:";
        }
    }
}
