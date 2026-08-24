package com.ecommerce.api_gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityHeadersFilterTest {
    @Test
    void addsBrowserHardeningHeaders() {
        SecurityHeadersFilter filter = new SecurityHeadersFilter();
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/v1/products"));

        filter.filter(exchange, ignored -> Mono.empty()).block();

        assertThat(exchange.getResponse().getHeaders().getFirst("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-Frame-Options")).isEqualTo("DENY");
        assertThat(exchange.getResponse().getHeaders().getFirst("Permissions-Policy"))
                .contains("camera=()", "payment=(self)");
    }
}
