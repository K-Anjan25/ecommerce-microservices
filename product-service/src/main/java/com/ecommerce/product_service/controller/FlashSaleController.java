package com.ecommerce.product_service.controller;

import com.ecommerce.product_service.dto.flashSale.FlashSaleDto;
import com.ecommerce.product_service.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/flash-sales")
public class FlashSaleController {
    private final FlashSaleService flashSaleService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<FlashSaleDto> createFlashSale(@Valid @RequestBody FlashSaleDto flashSaleDto){
        return new ResponseEntity<>(flashSaleService.createFlashSale(flashSaleDto), HttpStatus.CREATED);
    }

    /** Admin console: scheduled, live, ended and inactive sales. */
    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<FlashSaleDto>> getAllFlashSales(){
        return ResponseEntity.ok(flashSaleService.getAllFlashSales());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteFlashSale(@PathVariable Long id){
        flashSaleService.deleteFlashSale(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<FlashSaleDto>> getActiveFlashSales(){
        return ResponseEntity.ok(flashSaleService.getActiveFlashSales());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<FlashSaleDto> getFlashSaleByProductId(@PathVariable UUID productId){
        return ResponseEntity.ok(flashSaleService.getFlashSaleByProductId(productId));
    }
}
