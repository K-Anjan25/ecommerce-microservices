package com.ecommerce.product_service.controller;

import com.ecommerce.product_service.dto.priceWatch.WatchRequest;
import com.ecommerce.product_service.service.StockWatchService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.UUID;

/**
 * "Notify me when back in stock" watchlist. Subscribing/unsubscribing goes
 * through the gateway's guarded product-write route (authenticated, same as
 * price watches); the status check is a public read.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/products")
public class StockWatchController {

    private final StockWatchService stockWatchService;

    @PostMapping("/{productId}/stock-watch")
    public ResponseEntity<Void> watch(@PathVariable UUID productId,
                                      @Valid @RequestBody WatchRequest request) {
        stockWatchService.watchProduct(productId, request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{productId}/stock-watch")
    public ResponseEntity<Void> unwatch(@PathVariable UUID productId,
                                        @RequestParam("email") String email) {
        stockWatchService.unwatchProduct(productId, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{productId}/stock-watch")
    public ResponseEntity<WatchStatus> status(@PathVariable UUID productId,
                                              @RequestParam(value = "email", required = false) String email) {
        return ResponseEntity.ok(new WatchStatus(stockWatchService.isWatching(productId, email)));
    }

    @Getter
    @RequiredArgsConstructor
    static class WatchStatus {
        private final boolean watching;
    }
}
