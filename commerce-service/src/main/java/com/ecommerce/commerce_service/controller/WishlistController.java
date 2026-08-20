package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.wishlist.CreateWishlistItemRequest;
import com.ecommerce.commerce_service.dto.wishlist.WishlistItemDto;
import com.ecommerce.commerce_service.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/wishlist")
@RequiredArgsConstructor
@Slf4j
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<WishlistItemDto>> getWishlist(@RequestHeader("userId") String userId) {
        return ResponseEntity.ok(wishlistService.getWishlist(UUID.fromString(userId)));
    }

    @PostMapping
    public ResponseEntity<WishlistItemDto> addItem(@RequestHeader("userId") String userId,
                                                   @RequestBody CreateWishlistItemRequest request) {
        return new ResponseEntity<>(wishlistService.addItem(UUID.fromString(userId), request), HttpStatus.CREATED);
    }

    @DeleteMapping
    public ResponseEntity<String> removeItem(@RequestHeader("userId") String userId,
                                             @RequestParam UUID productId) {
        wishlistService.removeItem(UUID.fromString(userId), productId);
        return ResponseEntity.ok("Product removed from wishlist");
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clear(@RequestHeader("userId") String userId) {
        wishlistService.clear(UUID.fromString(userId));
        return ResponseEntity.ok("Wishlist cleared");
    }
}