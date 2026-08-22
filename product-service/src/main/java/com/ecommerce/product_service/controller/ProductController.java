package com.ecommerce.product_service.controller;


import com.ecommerce.product_service.dto.Pagination;
import com.ecommerce.product_service.dto.comment.CommentDto;
import com.ecommerce.product_service.dto.product.*;
import com.ecommerce.product_service.enumeration.Sort;
import com.ecommerce.product_service.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/products")
public class ProductController {
    private final ProductService productService;

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductDtoById(@PathVariable UUID id){
        return ResponseEntity.ok(productService.getProductDtoById(id));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentDto>> getCommentsByProductId(@PathVariable UUID id){
        return ResponseEntity.ok(productService.getCommentsByProductId(id));
    }

    @GetMapping("/findByIds/{productIds}")
    public ResponseEntity<List<ProductDto>> getProductsByIds(@PathVariable List<UUID> productIds){
        return ResponseEntity.ok(productService.getProductsByIds(productIds));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<ProductDto> saveProduct(@Valid @RequestBody CreateProductRequest createProductRequest){
        return new ResponseEntity<>(productService.createProduct(createProductRequest),HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<ProductDto> updateProduct(@Valid @RequestBody UpdateProductRequest updateProductRequest,
                                                    @PathVariable UUID id){
        return ResponseEntity.ok(productService.updateProduct(updateProductRequest,id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<UUID> deleteProduct(@PathVariable UUID id){
        return ResponseEntity.ok(productService.deleteProduct(id));
    }

    @GetMapping
    public ResponseEntity<ProductSearchResponse> getProductBySearch(@RequestParam(required = false, defaultValue = "") String searchTerm,
                                                     @RequestParam(required = false, defaultValue = "0") int page,
                                                     @RequestParam(required = false, defaultValue = "10") int size,
                                                     @RequestParam(required = false, defaultValue = "dateAsc") Sort sort,
                                                     @RequestParam(required = false, defaultValue = "") String filter,
                                                     @RequestParam(required = false, defaultValue = "") String brand,
                                                     @RequestParam(required = false, defaultValue = "0") double minPrice,
                                                     @RequestParam(required = false, defaultValue = "0") double maxPrice,
                                                      @RequestParam(required = false, defaultValue = "0") double minRating){
        return ResponseEntity.ok(productService.searchProduct(searchTerm,page,size,sort,filter,brand,minPrice,maxPrice,minRating));
    }

    @GetMapping("/suggest")
    public ResponseEntity<List<String>> getSearchSuggestions(@RequestParam(defaultValue = "") String term){
        return ResponseEntity.ok(productService.searchSuggestions(term));
    }

    @GetMapping("/brands")
    public ResponseEntity<java.util.List<String>> getBrands(){
        return ResponseEntity.ok(productService.searchBrands());
    }

    @GetMapping("/getAll")
    public ResponseEntity<Pagination<ProductDto>> getProductByPagination(@RequestParam(required = false,defaultValue = "0")  int pageNo,
                                                              @RequestParam(required = false,defaultValue = "10") int pageSize){
        return ResponseEntity.ok(productService.getAllProducts(pageNo,pageSize));
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<ProductDto>> getRelatedProducts(@PathVariable UUID id){
        return ResponseEntity.ok(productService.getRelatedProducts(id));
    }
}