package com.ecommerce.api_gateway.file;

import com.ecommerce.api_gateway.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class FileAuthorizationService {
    private final WebClient.Builder webClientBuilder;

    @Value("${USER_SERVICE_URI:http://localhost:8084}")
    private String userServiceUri;

    public Mono<UserDto> authenticatedUser(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }
        return webClientBuilder.build().post()
                .uri(userServiceUri + "/user/validateToken")
                .header(HttpHeaders.AUTHORIZATION, authorization)
                .retrieve()
                .bodyToMono(UserDto.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorMap(error -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    public boolean isAdmin(UserDto user) {
        return user.getAuthorities().stream().anyMatch(authority ->
                "ROLE_ADMIN".equals(authority.getAuthority()) || "ROLE_SUPER_ADMIN".equals(authority.getAuthority()));
    }
}
