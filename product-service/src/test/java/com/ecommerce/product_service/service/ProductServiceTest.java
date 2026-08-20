package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.product.CreateProductRequest;
import com.ecommerce.product_service.dto.product.ProductDto;
import com.ecommerce.product_service.dto.product.ProductMapper;
import com.ecommerce.product_service.inventory.service.InventoryService;
import com.ecommerce.product_service.model.Category;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryService categoryService;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private InventoryService inventoryService;

    private ProductService productService;

    private UUID productId;
    private Product testProduct;
    private ProductDto testProductDto;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, categoryService, productMapper, null, inventoryService);

        productId = UUID.randomUUID();

        testCategory = new Category();
        testCategory.setName("Test Category");

        testProduct = Product.builder()
                .id(productId)
                .name("Test Product")
                .unitPrice(BigDecimal.TEN)
                .description("Test Description")
                .category(testCategory)
                .build();

        testProductDto = ProductDto.builder()
                .id(productId)
                .name("Test Product")
                .unitPrice(BigDecimal.TEN)
                .description("Test Description")
                .build();
    }

    @Test
    void createProduct_shouldSaveProductAndUpsertStock() {
        CreateProductRequest request = new CreateProductRequest();
        request.setQuantityInStock(10);
        Category category = new Category();

        when(categoryService.getCategoryById(any())).thenReturn(category);
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);
        when(productMapper.productToProductDto(testProduct)).thenReturn(testProductDto);

        ProductDto result = productService.createProduct(request);

        assertThat(result.getName()).isEqualTo("Test Product");

        verify(inventoryService).upsertStock(productId, 10);
    }

    @Test
    void getProductDtoById_shouldReturnProduct() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productMapper.productToProductDto(testProduct)).thenReturn(testProductDto);

        ProductDto result = productService.getProductDtoById(productId);

        assertThat(result.getName()).isEqualTo("Test Product");
    }

    @Test
    void deleteProduct_shouldDeleteFromDbAndStock() {
        productService.deleteProduct(productId);

        verify(productRepository).deleteById(productId);
        verify(inventoryService).deleteProductFromInventory(productId);
    }
}
