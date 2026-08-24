package com.ecommerce.api_gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Small fixed-window limiter for abuse-sensitive public writes. It deliberately
 * avoids Redis to respect the platform's 2 GB / six-container budget.
 */
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {
    private static final long WINDOW_MILLIS = 60_000L;
    private static final int MAX_BUCKETS = 20_000;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong requests = new AtomicLong();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        Rule rule = ruleFor(exchange);
        if (rule == null) return chain.filter(exchange);

        long now = System.currentTimeMillis();
        String key = clientKey(exchange) + ":" + rule.name;
        Window window = windows.compute(key, (ignored, current) -> {
            if (current == null || now - current.startedAt >= WINDOW_MILLIS) {
                return new Window(now, 1);
            }
            current.count += 1;
            return current;
        });

        if (requests.incrementAndGet() % 1_000 == 0 || windows.size() > MAX_BUCKETS) {
            windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= WINDOW_MILLIS);
        }

        long remaining = Math.max(0, rule.limit - window.count);
        exchange.getResponse().getHeaders().set("X-RateLimit-Limit", String.valueOf(rule.limit));
        exchange.getResponse().getHeaders().set("X-RateLimit-Remaining", String.valueOf(remaining));

        if (window.count <= rule.limit) return chain.filter(exchange);

        long retryAfter = Math.max(1, (WINDOW_MILLIS - (now - window.startedAt) + 999) / 1000);
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().set("Retry-After", String.valueOf(retryAfter));
        String body = "{\"status\":429,\"message\":\"Too many requests. Please try again shortly.\",\"timestamp\":\""
                + Instant.now() + "\"}";
        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private Rule ruleFor(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethodValue();
        String path = exchange.getRequest().getURI().getPath();
        if ("POST".equals(method) && "/user/login".equals(path)) return new Rule("login", 10);
        if ("POST".equals(method) && "/user/register".equals(path)) return new Rule("register", 5);
        if ("POST".equals(method) && "/user/password-reset/request".equals(path)) return new Rule("password-reset", 5);
        if ("POST".equals(method) && "/user/password-reset/confirm".equals(path)) return new Rule("password-reset-confirm", 10);
        if ("POST".equals(method) && "/v1/orders".equals(path)) return new Rule("guest-order", 20);
        if ("GET".equals(method) && path.matches("/v1/orders/[^/]+/guest")) return new Rule("guest-order-track", 60);
        if ("POST".equals(method) && path.matches("/v1/orders/[^/]+/guest/cancel")) return new Rule("guest-order-cancel", 10);
        if ("POST".equals(method) && "/v1/payments".equals(path)) return new Rule("payment", 20);
        if ("POST".equals(method) && path.startsWith("/v1/payments/webhooks/")) return new Rule("payment-webhook", 120);
        if ("POST".equals(method) && path.startsWith("/v1/comments")) return new Rule("comment", 30);
        if ("POST".equals(method) && "/file/saveImage".equals(path)) return new Rule("image-upload", 20);
        return null;
    }

    private String clientKey(ServerWebExchange exchange) {
        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return remote == null || remote.getAddress() == null ? "unknown" : remote.getAddress().getHostAddress();
    }

    @Override
    public int getOrder() {
        return -100; // reject abuse before authentication or downstream I/O
    }

    private static final class Window {
        private final long startedAt;
        private int count;
        private Window(long startedAt, int count) { this.startedAt = startedAt; this.count = count; }
    }

    private static final class Rule {
        private final String name;
        private final int limit;
        private Rule(String name, int limit) { this.name = name; this.limit = limit; }
    }
}
