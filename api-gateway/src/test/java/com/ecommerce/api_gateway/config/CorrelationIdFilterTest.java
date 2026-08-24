package com.ecommerce.api_gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class CorrelationIdFilterTest {
    @Test
    void createsAndForwardsCorrelationId() {
        CorrelationIdFilter filter = new CorrelationIdFilter();
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/v1/products"));
        AtomicReference<String> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = next -> {
            forwarded.set(next.getRequest().getHeaders().getFirst(CorrelationIdFilter.HEADER));
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isNotBlank();
        assertThat(exchange.getResponse().getHeaders().getFirst(CorrelationIdFilter.HEADER))
                .isEqualTo(forwarded.get());
    }

    @Test
    void replacesUnsafeClientValue() {
        CorrelationIdFilter filter = new CorrelationIdFilter();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/").header(CorrelationIdFilter.HEADER, "bad value with spaces"));
        AtomicReference<String> forwarded = new AtomicReference<>();

        filter.filter(exchange, next -> {
            forwarded.set(next.getRequest().getHeaders().getFirst(CorrelationIdFilter.HEADER));
            return Mono.empty();
        }).block();

        assertThat(forwarded.get()).doesNotContain(" ").isNotEqualTo("bad value with spaces");
    }
}
