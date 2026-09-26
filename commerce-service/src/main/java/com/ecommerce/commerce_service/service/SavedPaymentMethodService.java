package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.model.SavedPaymentMethod;
import com.ecommerce.commerce_service.repository.SavedPaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Vaulted payment methods ("remember for my subscriptions"). Saved at
 * checkout; the Subscribe &amp; Save scheduler charges the default one
 * automatically (hybrid renewal). Tokens are provider-side references —
 * card data never touches Cartly.
 */
@Service
@RequiredArgsConstructor
public class SavedPaymentMethodService {

    private final SavedPaymentMethodRepository repository;

    public List<SavedPaymentMethod> myMethods() {
        return repository.findByUserIdOrderByDefaultFirst(currentUserId());
    }

    @Transactional
    public SavedPaymentMethod save(SavedPaymentMethod request) {
        UUID userId = currentUserId();
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment method token is required");
        }
        if (request.getProvider() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment provider is required");
        }
        SavedPaymentMethod method = SavedPaymentMethod.builder()
                .userId(userId)
                .provider(request.getProvider())
                .token(request.getToken())
                .brand(request.getBrand())
                .last4(request.getLast4())
                .isDefault(request.isDefault() || myMethods().isEmpty())
                .build();
        if (method.isDefault()) {
            clearDefault(userId);
        }
        return repository.save(method);
    }

    @Transactional
    public void delete(UUID id) {
        SavedPaymentMethod method = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Payment method could not be found"));
        if (!method.getUserId().equals(currentUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your payment method");
        }
        repository.delete(method);
    }

    private void clearDefault(UUID userId) {
        repository.findByUserIdOrderByDefaultFirst(userId).forEach(m -> {
            if (m.isDefault()) {
                m.setDefault(false);
                repository.save(m);
            }
        });
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !(authentication instanceof UsernamePasswordAuthenticationToken)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sign in required");
        }
        try {
            return UUID.fromString(String.valueOf(authentication.getPrincipal()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sign in required");
        }
    }
}
