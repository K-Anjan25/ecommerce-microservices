package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.cartItem.CartItemMapper;
import com.ecommerce.commerce_service.dto.cartItem.CreateCartItemRequest;
import com.ecommerce.commerce_service.dto.cartItem.UpdateCartItemRequest;
import com.ecommerce.commerce_service.model.Cart;
import com.ecommerce.commerce_service.model.CartItem;
import com.ecommerce.commerce_service.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemMapper cartItemMapper;

    private CartService cartService;

    private UUID customerId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        cartService = new CartService(cartRepository, cartItemMapper);
        customerId = UUID.randomUUID();
        productId = UUID.randomUUID();
    }

    @Test
    void save_shouldCreateNewCart_whenNoCartExists() {
        CreateCartItemRequest request = new CreateCartItemRequest();
        CartItem cartItem = CartItem.builder()
                .productId(productId)
                .name("Test Product")
                .price(BigDecimal.TEN)
                .quantity(2)
                .totalPrice(BigDecimal.valueOf(20))
                .build();

        when(cartRepository.findCartByCustomerId(customerId)).thenReturn(Optional.empty());
        when(cartItemMapper.createCartItemRequestToCartItem(request)).thenReturn(cartItem);

        cartService.save(customerId, request);

        ArgumentCaptor<Cart> captor = ArgumentCaptor.forClass(Cart.class);
        verify(cartRepository).save(captor.capture());
        Cart saved = captor.getValue();

        assertThat(saved.getCustomerId()).isEqualTo(customerId);
        assertThat(saved.getCartItems()).hasSize(1);
        assertThat(saved.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(20));
    }

    @Test
    void save_shouldAddItemToExistingCart() {
        CartItem existingItem = CartItem.builder()
                .productId(UUID.randomUUID())
                .name("Existing")
                .price(BigDecimal.valueOf(5))
                .quantity(1)
                .totalPrice(BigDecimal.valueOf(5))
                .build();

        Cart existingCart = Cart.builder()
                .customerId(customerId)
                .cartItems(new ArrayList<>(List.of(existingItem)))
                .totalPrice(BigDecimal.valueOf(5))
                .build();

        CreateCartItemRequest request = mock(CreateCartItemRequest.class);
        CartItem newItem = CartItem.builder()
                .productId(productId)
                .name("New")
                .price(BigDecimal.TEN)
                .quantity(2)
                .totalPrice(BigDecimal.valueOf(20))
                .build();

        when(cartRepository.findCartByCustomerId(customerId)).thenReturn(Optional.of(existingCart));
        when(cartItemMapper.createCartItemRequestToCartItem(request)).thenReturn(newItem);

        cartService.save(customerId, request);

        assertThat(existingCart.getCartItems()).hasSize(2);
        assertThat(existingCart.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(25));
    }

    @Test
    void save_shouldIncrementQuantity_whenProductAlreadyInCart() {
        CartItem existingItem = CartItem.builder()
                .productId(productId)
                .name("Same Product")
                .price(BigDecimal.TEN)
                .quantity(1)
                .totalPrice(BigDecimal.TEN)
                .build();

        Cart existingCart = Cart.builder()
                .customerId(customerId)
                .cartItems(new ArrayList<>(List.of(existingItem)))
                .totalPrice(BigDecimal.TEN)
                .build();

        CreateCartItemRequest request = mock(CreateCartItemRequest.class);
        when(request.getProductId()).thenReturn(productId);
        when(request.getQuantity()).thenReturn(1);

        when(cartRepository.findCartByCustomerId(customerId)).thenReturn(Optional.of(existingCart));

        cartService.save(customerId, request);

        verify(cartItemMapper, never()).createCartItemRequestToCartItem(any());
        assertThat(existingItem.getQuantity()).isEqualTo(2);
        assertThat(existingItem.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(20));
        assertThat(existingCart.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(20));
    }

    @Test
    void updateQuantity_shouldUpdateItemQuantityAndTotalPrice() {
        CartItem item = CartItem.builder()
                .productId(productId)
                .name("Test")
                .price(BigDecimal.TEN)
                .quantity(1)
                .totalPrice(BigDecimal.TEN)
                .build();

        Cart cart = Cart.builder()
                .customerId(customerId)
                .cartItems(new ArrayList<>(List.of(item)))
                .totalPrice(BigDecimal.TEN)
                .build();

        UpdateCartItemRequest request = mock(UpdateCartItemRequest.class);
        when(request.getProductId()).thenReturn(productId);
        when(request.getQuantity()).thenReturn(3);

        when(cartRepository.findCartByCustomerId(customerId)).thenReturn(Optional.of(cart));

        cartService.updateQuantity(customerId, request);

        assertThat(item.getQuantity()).isEqualTo(3);
        assertThat(item.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(30));
        assertThat(cart.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(30));
    }

    @Test
    void removeItem_shouldDeleteCart_whenNoItemsRemain() {
        CartItem item = CartItem.builder()
                .productId(productId)
                .name("Test")
                .price(BigDecimal.TEN)
                .quantity(1)
                .totalPrice(BigDecimal.TEN)
                .build();

        Cart cart = Cart.builder()
                .customerId(customerId)
                .cartItems(new ArrayList<>(List.of(item)))
                .totalPrice(BigDecimal.TEN)
                .build();

        when(cartRepository.findCartByCustomerId(customerId)).thenReturn(Optional.of(cart));

        cartService.removeItem(customerId, productId, null);

        verify(cartRepository).delete(cart);
        verify(cartRepository, never()).save(any());
    }

    @Test
    void removeItem_shouldRecalculateTotal_whenItemsRemain() {
        CartItem item1 = CartItem.builder()
                .productId(productId)
                .name("To Remove")
                .price(BigDecimal.TEN)
                .quantity(1)
                .totalPrice(BigDecimal.TEN)
                .build();

        CartItem item2 = CartItem.builder()
                .productId(UUID.randomUUID())
                .name("Keep")
                .price(BigDecimal.valueOf(5))
                .quantity(2)
                .totalPrice(BigDecimal.valueOf(10))
                .build();

        Cart cart = Cart.builder()
                .customerId(customerId)
                .cartItems(new ArrayList<>(List.of(item1, item2)))
                .totalPrice(BigDecimal.valueOf(20))
                .build();

        when(cartRepository.findCartByCustomerId(customerId)).thenReturn(Optional.of(cart));

        cartService.removeItem(customerId, productId, null);

        verify(cartRepository, never()).delete(any());
        assertThat(cart.getCartItems()).hasSize(1);
        assertThat(cart.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(10));
    }

    @Test
    void getCarts_shouldReturnAllCarts() {
        when(cartRepository.findAll()).thenReturn(List.of(new Cart(), new Cart()));

        List<Cart> result = cartService.getCarts();

        assertThat(result).hasSize(2);
    }
}
