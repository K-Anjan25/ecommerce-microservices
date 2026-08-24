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
import com.ecommerce.product_service.model.ProductImage;
import com.ecommerce.product_service.model.ProductVariant;
import com.ecommerce.product_service.repository.ProductRepository;
import com.ecommerce.product_service.repository.ProductImageRepository;
import com.ecommerce.product_service.repository.ProductVariantRepository;
import com.ecommerce.product_service.repository.FlashSaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final FlashSaleRepository flashSaleRepository;
    private final PriceWatchService priceWatchService;

    @Transactional(readOnly = true)
    public Pagination<ProductDto> getAllProducts(int pageNo, int pageSize) {
        Pageable paging = PageRequest.of(pageNo, pageSize);
        Page<Product> products = productRepository.findAll(paging);

        return new Pagination<>(products.stream().map(productMapper::productToProductDto).collect(Collectors.toList()),
                products.getTotalElements());
    }

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByProductId(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(()->{
                    log.error("Product with id: {} could not be found!", id);
                    throw new ProductNotFoundException("Product with id " + id + " could not be found!");
                });
        return product.getComments().stream().map(commentMapper::commentToCommentDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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
                .brand(createProductRequest.getBrand())
                .originalPrice(createProductRequest.getOriginalPrice())
                .badge(createProductRequest.getBadge() == null ? "NONE" : createProductRequest.getBadge())
                .featured(Boolean.TRUE.equals(createProductRequest.getFeatured()))
                .build();

        Product savedProduct = productRepository.save(product);

        applyImages(savedProduct, createProductRequest);
        applyVariants(savedProduct, createProductRequest);

        if (!hasVariants(savedProduct) && savedProduct.getId() != null) {
            inventoryService.upsertStock(savedProduct.getId(),
                    createProductRequest.getQuantityInStock() == null ? 0
                            : createProductRequest.getQuantityInStock());
        }

        return productMapper.productToProductDto(productRepository.findById(savedProduct.getId()).orElse(savedProduct));
    }

    public ProductDto updateProduct(UpdateProductRequest updateProductRequest,UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(()->{
                    log.error("Product with id: {} could not be found!", productId);
                    throw new ProductNotFoundException("Product with id " + productId + " could not be found!");
                });

        Category category = categoryService.getCategoryById(updateProductRequest.getCategoryId());

        BigDecimal previousUnitPrice = product.getUnitPrice();

        product.setCategory(category);
        product.setDescription(updateProductRequest.getDescription());
        product.setName(updateProductRequest.getName());
        product.setUnitPrice(updateProductRequest.getUnitPrice());
        product.setImageUrl(updateProductRequest.getImageUrl());
        product.setBrand(updateProductRequest.getBrand());
        product.setOriginalPrice(updateProductRequest.getOriginalPrice());
        product.setBadge(updateProductRequest.getBadge() == null ? "NONE" : updateProductRequest.getBadge());
        product.setFeatured(Boolean.TRUE.equals(updateProductRequest.getFeatured()));

        boolean hasVariantRequest = updateProductRequest.getVariants() != null
                && !updateProductRequest.getVariants().isEmpty();

        applyImages(product, updateProductRequest);
        applyVariants(product, updateProductRequest);

        if (hasVariantRequest) {
            inventoryService.deleteProductFromInventory(productId);
        } else {
            productVariantRepository.deleteByProductId(productId);
            product.setVariants(new HashSet<>());
            inventoryService.upsertStock(productId,
                    updateProductRequest.getQuantityInStock() == null ? 0
                            : updateProductRequest.getQuantityInStock());
        }

        productRepository.save(product);

        // Phase 8: queue price-drop alert emails when the unit price decreased.
        try {
            priceWatchService.notifyPriceDrop(productId, product.getName(),
                    previousUnitPrice, product.getUnitPrice());
        } catch (Exception e) {
            log.error("Price-drop notification failed for product {}", productId, e);
        }

        return productMapper.productToProductDto(productRepository.findById(productId).orElse(product));
    }

    private boolean hasVariants(Product product) {
        return product.getVariants() != null && !product.getVariants().isEmpty();
    }

    private void applyImages(Product product, Object request) {
        List<String> images = request instanceof CreateProductRequest
                ? ((CreateProductRequest) request).getImages()
                : ((UpdateProductRequest) request).getImages();
        if (images == null) {
            return;
        }
        productImageRepository.deleteByProductId(product.getId());
        List<ProductImage> productImages = new ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            productImages.add(ProductImage.builder()
                    .product(product)
                    .url(images.get(i))
                    .sortOrder(i)
                    .build());
        }
        productImageRepository.saveAll(productImages);
        product.setImages(new HashSet<>(productImages));
    }

    private void applyVariants(Product product, Object request) {
        List<com.ecommerce.product_service.dto.product.variant.ProductVariantDto> variants =
                request instanceof CreateProductRequest
                        ? ((CreateProductRequest) request).getVariants()
                        : ((UpdateProductRequest) request).getVariants();
        if (variants == null) {
            return;
        }
        productVariantRepository.deleteByProductId(product.getId());
        List<ProductVariant> productVariants = new ArrayList<>();
        for (var v : variants) {
            productVariants.add(ProductVariant.builder()
                    .product(product)
                    .name(v.getName())
                    .sku(v.getSku())
                    .price(v.getPrice())
                    .quantityInStock(v.getQuantityInStock())
                    .attributes(v.getAttributes())
                    .build());
        }
        productVariantRepository.saveAll(productVariants);
        product.setVariants(new HashSet<>(productVariants));
    }

    @Transactional
    public UUID deleteProduct(UUID id) {
        productRepository.deleteById(id);

        inventoryService.deleteProductFromInventory(id);
        return id;
    }

    @Transactional(readOnly = true)
    public ProductSearchResponse searchProduct(String searchTerm, int page, int size, Sort sort, String filter,
                                                String brand, double minPrice, double maxPrice, double minRating) {
        String normalizedSearchTerm = searchTerm == null ? "" : searchTerm.trim();
        String normalizedFilter = filter == null ? "" : filter;
        String normalizedBrand = brand == null ? "" : brand;

        List<Product> filtered = productRepository.searchProducts(
                normalizedSearchTerm, normalizedFilter, normalizedBrand, minPrice, maxPrice, minRating,
                Pageable.unpaged()).getContent();
        Facets facets = computeFacets(filtered);

        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(sort.getDirection(), sort.getField()));

        Page<Product> products = productRepository.searchProducts(
                normalizedSearchTerm, normalizedFilter, normalizedBrand, minPrice, maxPrice, minRating, pageable);

        List<ProductSearchDto> content = products.stream()
                .map(productMapper::productToProductSearchDto)
                .collect(Collectors.toList());

        return ProductSearchResponse.builder()
                .content(content)
                .facets(facets)
                .build();
    }

    private Facets computeFacets(List<Product> products) {
        Map<String, Long> brandCounts = products.stream()
                .filter(p -> p.getBrand() != null && !p.getBrand().isBlank())
                .collect(Collectors.groupingBy(Product::getBrand, Collectors.counting()));
        List<FacetCount> brands = brandCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> FacetCount.builder().value(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());

        Map<String, Long> categoryCounts = products.stream()
                .filter(p -> p.getCategory() != null && p.getCategory().getName() != null)
                .collect(Collectors.groupingBy(p -> p.getCategory().getName(), Collectors.counting()));
        List<FacetCount> categories = categoryCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> FacetCount.builder().value(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());

        BigDecimal priceMin = products.stream().map(Product::getUnitPrice).min(BigDecimal::compareTo).orElse(null);
        BigDecimal priceMax = products.stream().map(Product::getUnitPrice).max(BigDecimal::compareTo).orElse(null);

        return Facets.builder()
                .brands(brands)
                .categories(categories)
                .priceMin(priceMin)
                .priceMax(priceMax)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProductSearchSuggestion> searchSuggestions(String term) {
        String normalized = term == null ? "" : term.trim();
        if (normalized.length() < 2) {
            return List.of();
        }
        return productRepository.suggestProducts(normalized, PageRequest.of(0, 6));
    }

    public List<String> searchBrands() {
        return productRepository.findAllBrands();
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getRelatedProducts(UUID productId) {
        Product product = getProductById(productId);
        if (product.getCategory() == null) {
            return List.of();
        }
        Pageable pageable = PageRequest.of(0, 4);
        return productRepository.findByCategoryIdAndIdNot(product.getCategory().getId(), productId, pageable)
                .stream()
                .map(productMapper::productToProductDto)
                .collect(Collectors.toList());
    }

}

