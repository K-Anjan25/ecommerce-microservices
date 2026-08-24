package com.ecommerce.commerce_service.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Authenticates commerce-to-product calls that can inspect or mutate stock. */
@Configuration
public class InternalServiceFeignConfig {
    @Bean
    public RequestInterceptor internalServiceAuthentication(
            @Value("${internal-service.secret:cartly-internal-dev-only}") String secret) {
        return template -> template.header("X-Internal-Service", secret);
    }
}
