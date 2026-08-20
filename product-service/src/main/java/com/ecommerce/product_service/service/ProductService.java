package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.Pagination;
import com.ecommerce.product_service.dto.comment.CommentDto;
import com.ecommerce.product_service.dto.comment.CommentMapper;
import com.ecommerce.product_service.dto.product.*;
import com.ecommerce.product_service.enumeration.Sort;
import com.ecommerce.product_service.exception.ProductNotFoundException;
import com.ecommerce.product_service.inventory.service.InventoryService;
import com.ecommerce.product_service.model.Category;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final ProductMapper productMapper;
    private final CommentMapper commentMapper;
    private final InventoryService inventoryService;

    public Pagination<ProductDto> getAllProducts(int pageNo, int pageSize) {
        Pageable paging = PageRequest.of(pageNo, pageSize);
        Page<Product> products = productRepository.findAll(paging);

        return new Pagination<>(products.stream().map(productMapper::productToProductDto).collect(Collectors.toList()),
                products.getTotalElements());
    }

    public ProductDto getProductDtoById(UUID id) {
        return productMapper.productToProductDto(productRepository.findById(id)
                .orElseThrow(()->{
                    log.error("Product with id: {} could not be found!", id);
                    throw new ProductNotFoundException("Product with id " + id + " could not be found!");
                }));
    }

    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(()->{
                    log.error("Product with id: {} could not be found!", id);
                    throw new ProductNotFoundException("Product with id " + id + " could not be found!");
                });
    }

    public List<CommentDto> getCommentsByProductId(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(()->{
                    log.error("Product with id: {} could not be found!", id);
                    throw new ProductNotFoundException("Product with id " + id + " could not be found!");
                });
        return product.getComments().stream().map(commentMapper::commentToCommentDto).collect(Collectors.toList());
    }

    public List<ProductDto> getProductsByIds(List<UUID> productIds) {
        List<Product> products = productRepository.findByIdIn(productIds);
        return products.stream().map(productMapper::productToProductDto).collect(Collectors.toList());
    }

    @Transactional
    public ProductDto createProduct(CreateProductRequest createProductRequest) {

        Category category = categoryService.getCategoryById(createProductRequest.getCategoryId());

        Product product =  Product.builder()
                .name(createProductRequest.getName())
                .unitPrice(createProductRequest.getUnitPrice())
                .description(createProductRequest.getDescription())
                .category(category)
                .imageUrl(createProductRequest.getImageUrl())
                .build();

        Product savedProduct = productRepository.save(product);

        inventoryService.upsertStock(savedProduct.getId(), createProductRequest.getQuantityInStock());

        return productMapper.productToProductDto(savedProduct);
    }

    public ProductDto updateProduct(UpdateProductRequest updateProductRequest,UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(()->{
                    log.error("Product with id: {} could not be found!", productId);
                    throw new ProductNotFoundException("Product with id " + productId + " could not be found!");
                });

        Category category = categoryService.getCategoryById(updateProductRequest.getCategoryId());

        product.setCategory(category);
        product.setDescription(updateProductRequest.getDescription());
        product.setName(updateProductRequest.getName());
        product.setUnitPrice(updateProductRequest.getUnitPrice());
        product.setImageUrl(updateProductRequest.getImageUrl());

        inventoryService.upsertStock(productId, updateProductRequest.getQuantityInStock());

        productRepository.save(product);
        return productMapper.productToProductDto(product);
    }

    @Transactional
    public UUID deleteProduct(UUID id) {
        productRepository.deleteById(id);

        inventoryService.deleteProductFromInventory(id);
        return id;
    }

    public List<ProductSearchDto> searchProduct(String searchTerm, int page, int size, Sort sort, String filter) {
        String normalizedSearchTerm = searchTerm == null ? "" : searchTerm.trim();
        String normalizedFilter = filter == null ? "" : filter;

        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(sort.getDirection(), sort.getField()));

        Page<Product> products = productRepository.searchProducts(normalizedSearchTerm, normalizedFilter, pageable);

        return products.stream().map(productMapper::productToProductSearchDto).collect(Collectors.toList());
    }

}

