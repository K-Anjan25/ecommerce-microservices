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
    public void watchProduct(UUID productId, String rawEmail, String rawLocale) {
        String email = normalize(rawEmail);
        if (!isValid(email)) {
            throw new IllegalArgumentException("A valid email is required");
        }
        String locale = normalizeLocale(rawLocale);
        Optional<ProductStockWatch> existing = stockWatchRepository.findByProductIdAndEmail(productId, email);
        if (existing.isPresent()) {
            existing.get().setActive(true);
            existing.get().setLocale(locale);
            stockWatchRepository.save(existing.get());
            return;
        }
        stockWatchRepository.save(ProductStockWatch.builder()
                .productId(productId)
                .email(email)
                .locale(locale)
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
        String productUrl = frontendUrl + "/products/" + productId;
        for (ProductStockWatch watch : watches) {
            String locale = watch.getLocale();
            String subject = "CARTLY - " + stockSubject(locale, productName);
            String text = stockGreeting(locale) + "\n\n"
                    + productName + " " + stockAvailableLine(locale) + "\n\n"
                    + stockCta(locale) + " " + productUrl;
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

    static String stockSubject(String locale, String productName) {
        switch (normalizeLocale(locale)) {
            case "hi": return "दुबारा स्टॉक में: " + productName;
            case "de": return "Wieder verf\u00fcgbar: " + productName;
            case "fr": return "De retour en stock : " + productName;
            case "nl": return "Weer op voorraad: " + productName;
            case "es": return "De nuevo en stock: " + productName;
            case "sv": return "Tillbaka i lager: " + productName;
            case "ar": return "متوفر مجدداً: " + productName;
            case "ja": return "再入荷: " + productName;
            case "ko": return "재입고: " + productName;
            default: return "Back in stock: " + productName;
        }
    }

    static String stockGreeting(String locale) {
        switch (normalizeLocale(locale)) {
            case "hi": return "अच्छी खबर — आपकी वॉचलिस्ट की कोई चीज़ दुबारा आ गई है!";
            case "de": return "Gute Nachricht — etwas auf Ihrer Merkliste ist zur\u00fcck!";
            case "fr": return "Bonne nouvelle — un article de votre liste est de retour !";
            case "nl": return "Goed nieuws — iets op je verlanglijst is terug!";
            case "es": return "Buenas noticias: \u00a1algo de tu lista ha vuelto!";
            case "sv": return "Bra nyheter — n\u00e5got p\u00e5 din \u00f6nskelista \u00e4r tillbaka!";
            case "ar": return "خبر سار — شيء من قائمتك عاد!";
            case "ja": return "お知らせ — ウォッチリストの商品が戻ってきました！";
            case "ko": return "소식 — 위시리스트의 상품이 돌아왔습니다!";
            default: return "Good news — something on your watchlist is back!";
        }
    }

    static String stockAvailableLine(String locale) {
        switch (normalizeLocale(locale)) {
            case "hi": return "फिर से उपलब्ध है।";
            case "de": return "ist wieder verf\u00fcgbar.";
            case "fr": return "est de nouveau disponible.";
            case "nl": return "is weer leverbaar.";
            case "es": return "est\u00e1 disponible de nuevo.";
            case "sv": return "\u00e4r tillbaka i lager.";
            case "ar": return "متاح مرة أخرى.";
            case "ja": return "が再び購入可能になりました。";
            case "ko": return "다시 구매 가능합니다.";
            default: return "is available again.";
        }
    }

    static String stockCta(String locale) {
        switch (normalizeLocale(locale)) {
            case "hi": return "पिछली बार यह जल्दी बिक गया था — यहाँ से खरीदें:";
            case "de": return "Es war schnell weg — hier zugreifen:";
            case "fr": return "Parti vite la derni\u00e8re fois — saisissez-le ici :";
            case "nl": return "Het was snel uitverkocht — grijp hem hier:";
            case "es": return "La \u00faltima vez vol\u00f3 — cons\u00edgelo aqu\u00ed:";
            case "sv": return "Den slutade snabbt sist — f\u00e5 tag p\u00e5 den h\u00e4r:";
            case "ar": return "نفد بسرعة المرة الماضية — احصل عليه من هنا:";
            case "ja": return "前回はすぐに完売しました。こちらから:";
            case "ko": return "지난번엔 금방 품절되었습니다. 여기에서 담기:";
            default: return "It sold out fast last time — grab it here:";
        }
    }
}
