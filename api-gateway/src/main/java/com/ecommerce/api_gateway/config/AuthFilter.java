package com.ecommerce.api_gateway.config;

import com.ecommerce.api_gateway.dto.AuthorityDto;
import com.ecommerce.api_gateway.dto.ErrorDto;
import com.ecommerce.api_gateway.dto.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.stream.Collectors;

@Component
public class AuthFilter extends AbstractGatewayFilterFactory<AuthFilter.Config> {

    private final WebClient.Builder webClientBuilder;

    @Value("${USER_SERVICE_URI:http://localhost:8084}")
    private String userServiceUri;

    public AuthFilter(WebClient.Builder webClientBuilder) {
        super(Config.class);
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String[] parts = authHeader.trim().split("\\s+", 2);
            if (parts.length != 2 || !"Bearer".equals(parts[0]) || parts[1].isBlank()) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            return webClientBuilder.build()
                    .post()
                    // Keep bearer credentials in headers; query strings are routinely logged.
                    .uri(userServiceUri + "/user/validateToken")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .onStatus(HttpStatus::is4xxClientError, response -> response.bodyToMono(ErrorDto.class)
                            .flatMap(error -> Mono.error(new RuntimeException(error.getError_message()))))
                    .bodyToMono(UserDto.class)
                    .timeout(Duration.ofSeconds(5))
                    .flatMap(userDto -> {
                        String authorities = userDto.getAuthorities().stream()
                                .map(AuthorityDto::getAuthority)
                                .collect(Collectors.joining(","));

                        ServerHttpRequest request = exchange.getRequest()
                                .mutate()
                                .headers(headers -> {
                                    // Never trust identity headers supplied by the public client.
                                    headers.remove("userId");
                                    headers.remove("authorities");
                                    headers.remove("username");
                                    headers.set("userId", userDto.getUserId());
                                    headers.set("authorities", authorities);
                                    headers.set("username", userDto.getUsername());
                                })
                                .build();

                        return chain.filter(exchange.mutate().request(request).build());
                    })
                    .onErrorResume(error -> {
                        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return exchange.getResponse().setComplete();
                    });
        };
    }

    public static class Config {
    }
}
