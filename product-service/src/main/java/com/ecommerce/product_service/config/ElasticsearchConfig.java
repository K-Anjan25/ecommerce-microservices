package com.ecommerce.product_service.config;

import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.RestClients;

@Configuration
class ElasticsearchConfig {

    @Value("${spring.elasticsearch.rest.uris:http://elasticsearch:9200}")
    private String elasticsearchUri;

    @Bean
    RestHighLevelClient elasticsearchClient() {
        final ClientConfiguration clientConfiguration =
                ClientConfiguration.builder().connectedTo(extractHost()).build();
        return RestClients.create(clientConfiguration).rest();
    }

    private String extractHost() {
        // Remove http/https protocol if present and extract host:port
        String host = elasticsearchUri.replaceAll("^https?://", "");
        return host;
    }
}