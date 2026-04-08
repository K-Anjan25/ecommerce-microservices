package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.ProductModel;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.UUID;

public interface ProductElasticRepository extends ElasticsearchRepository<ProductModel, UUID> {
}