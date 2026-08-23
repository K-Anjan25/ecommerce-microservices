package com.ecommerce.api_gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;
import java.util.regex.Pattern;

/** Creates one safe request id at the edge and forwards it through every service. */
@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {
    public static final String HEADER = "X-Correlation-ID";
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9._-]{1,100}");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String supplied = exchange.getRequest().getHeaders().getFirst(HEADER);
        String correlationId = supplied != null && SAFE_ID.matcher(supplied).matches()
                ? supplied : UUID.randomUUID().toString();
        ServerWebExchange correlated = exchange.mutate()
                .request(request -> request.headers(headers -> headers.set(HEADER, correlationId)))
                .build();
        correlated.getResponse().getHeaders().set(HEADER, correlationId);
        return chain.filter(correlated);
    }

    @Override
    public int getOrder() {
        return -200;
    }
}
