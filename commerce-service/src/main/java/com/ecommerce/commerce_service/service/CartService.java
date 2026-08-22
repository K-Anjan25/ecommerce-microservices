package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.cartItem.CartItemMapper;
import com.ecommerce.commerce_service.dto.cartItem.CreateCartItemRequest;
import com.ecommerce.commerce_service.dto.cartItem.UpdateCartItemRequest;
import com.ecommerce.commerce_service.model.Cart;
import com.ecommerce.commerce_service.model.CartItem;
import com.ecommerce.commerce_service.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

import static com.ecommerce.common.util.StaticFunctions.toSingleton;


@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {
    private final CartRepository cartRepository;

    private final CartItemMapper cartItemMapper;

    @Transactional
    public void save(UUID customerId, CreateCartItemRequest createCartItemRequest) {
        Optional<Cart> cart = cartRepository.findCartByCustomerId(customerId);

        if (cart.isPresent()) {
            Cart presentCart = cart.get();
            Optional<CartItem> existing = presentCart.getCartItems().stream()
                    .filter(item -> sameLine(item, createCartItemRequest.getProductId(), createCartItemRequest.getVariantId()))
                    .findFirst();

            if (existing.isPresent()) {
                CartItem item = existing.get();
                item.setQuantity(item.getQuantity() + createCartItemRequest.getQuantity());
                item.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            } else {
                CartItem cartItem = cartItemMapper.createCartItemRequestToCartItem(createCartItemRequest);
                presentCart.getCartItems().add(cartItem);
            }
            presentCart.setTotalPrice(getTotalPrice(presentCart));
            cartRepository.save(presentCart);
        } else {
            CartItem cartItem = cartItemMapper.createCartItemRequestToCartItem(createCartItemRequest);
            Cart newCart = Cart.builder()
                    .customerId(customerId)
                    .cartItems(new ArrayList<>(List.of(cartItem)))
                    .build();
            newCart.setTotalPrice(getTotalPrice(newCart));
            cartRepository.save(newCart);
        }
    }

    public List<Cart> getCarts() {
        return cartRepository.findAll();
    }

    @Transactional
    public void updateQuantity(UUID customerId, UpdateCartItemRequest updateCartItemRequest) {
        Cart cart = cartRepository.findCartByCustomerId(customerId)
                .orElseThrow(() -> {
                    log.error("Cart with id: {} could not be found!", customerId);
                    throw new RuntimeException("Cart is not found with id :" + customerId);
                });

        CartItem cartItem = cart
                .getCartItems()
                .stream()
                .filter(eachCart -> sameLine(eachCart, updateCartItemRequest.getProductId(), updateCartItemRequest.getVariantId()))
                .collect(toSingleton());

        cartItem.setQuantity(updateCartItemRequest.getQuantity());
        cartItem.setTotalPrice(cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        cart.setTotalPrice(getTotalPrice(cart));
        cartRepository.save(cart);
    }

    @Transactional
    public void removeItem(UUID customerId, UUID productId, UUID variantId) {
        Cart cart = cartRepository.findCartByCustomerId(customerId)
                .orElseThrow(() -> {
                    log.error("Cart for customer {} could not be found!", customerId);
                    throw new RuntimeException("Cart is not found for customer :" + customerId);
                });

        cart.getCartItems().removeIf(item -> sameLine(item, productId, variantId));

        if (cart.getCartItems().isEmpty()) {
            cartRepository.delete(cart);
        } else {
            cart.setTotalPrice(getTotalPrice(cart));
            cartRepository.save(cart);
        }
    }

    private BigDecimal getTotalPrice(Cart cart) {
        return cart.getCartItems().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean sameLine(CartItem item, UUID productId, UUID variantId) {
        boolean productMatch = item.getProductId() != null && item.getProductId().equals(productId);
        boolean variantMatch = (item.getVariantId() == null && variantId == null)
                || (item.getVariantId() != null && item.getVariantId().equals(variantId));
        return productMatch && variantMatch;
    }
}
