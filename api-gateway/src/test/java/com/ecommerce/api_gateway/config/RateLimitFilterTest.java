package com.ecommerce.api_gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {
    @Test
    void blocksTheEleventhLoginFromTheSameClientWithinAWindow() {
        RateLimitFilter filter = new RateLimitFilter();
        AtomicInteger forwarded = new AtomicInteger();
        GatewayFilterChain chain = exchange -> {
            forwarded.incrementAndGet();
            return Mono.empty();
        };

        MockServerWebExchange last = null;
        for (int i = 0; i < 11; i++) {
            last = exchange("POST", "/user/login", "192.0.2.10");
            filter.filter(last, chain).block();
        }

        assertThat(forwarded.get()).isEqualTo(10);
        assertThat(last.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(last.getResponse().getHeaders().getFirst("Retry-After")).isNotBlank();
    }

    @Test
    void doesNotLimitReadOnlyCatalogTraffic() {
        RateLimitFilter filter = new RateLimitFilter();
        AtomicInteger forwarded = new AtomicInteger();
        GatewayFilterChain chain = exchange -> {
            forwarded.incrementAndGet();
            return Mono.empty();
        };

        for (int i = 0; i < 50; i++) {
            filter.filter(exchange("GET", "/v1/products", "192.0.2.20"), chain).block();
        }

        assertThat(forwarded.get()).isEqualTo(50);
    }

    private MockServerWebExchange exchange(String method, String path, String ip) {
        MockServerHttpRequest.BaseBuilder<?> request = "POST".equals(method)
                ? MockServerHttpRequest.post(path)
                : MockServerHttpRequest.get(path);
        return MockServerWebExchange.from(request.remoteAddress(new InetSocketAddress(ip, 43120)).build());
    }
}
