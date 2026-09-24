package com.ecommerce.product_service.service;

import com.ecommerce.common.model.UserCredential;
import com.ecommerce.product_service.dto.comment.CommentDto;
import com.ecommerce.product_service.dto.comment.CommentMapper;
import com.ecommerce.product_service.dto.comment.CreateCommentRequest;
import com.ecommerce.product_service.model.Comment;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {
    private final CommentRepository commentRepository;
    private final ProductService productService;
    private final CommentMapper commentMapper;
    private final org.springframework.boot.web.client.RestTemplateBuilder restTemplateBuilder;

    private RestTemplate restTemplate() {
        return restTemplateBuilder.build();
    }

    @Value("${commerce-service.url:http://localhost:8081}")
    private String commerceServiceUrl;

    @Value("${internal-service.secret:cartly-internal-dev-only}")
    private String internalSecret;

    public CommentDto createComment(CreateCommentRequest createCommentDto){
        Product product = productService.getProductById(createCommentDto.getProductId());
        UserCredential userCredential = (UserCredential) SecurityContextHolder.getContext()
                .getAuthentication().getCredentials();
        UUID userId = currentUserId();

        Comment comment = Comment.builder()
                .product(product)
                .text(createCommentDto.getText())
                .rating(createCommentDto.getRating())
                .creator(userCredential.getUsername())
                .userId(userId)
                // Server-verified: a "verified purchase" badge is only ever set
                // from the order service, never from client input.
                .verifiedPurchase(userId != null
                        && isVerifiedPurchase(userId, createCommentDto.getProductId()))
                .build();

        return commentMapper.commentToCommentDto(commentRepository.save(comment));
    }

    /** The gateway injects the validated user id as the principal. */
    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        try {
            return UUID.fromString(String.valueOf(authentication.getPrincipal()));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    /** Ask commerce-service (shared internal secret) whether the user bought it. */
    private boolean isVerifiedPurchase(UUID userId, UUID productId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Service", internalSecret);
            ResponseEntity<Map> response = restTemplate().exchange(
                    commerceServiceUrl + "/internal/orders/verified-purchase?customerId={c}&productId={p}",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class,
                    userId.toString(),
                    productId.toString());
            Object verified = response.getBody() == null ? null : response.getBody().get("verified");
            return Boolean.TRUE.equals(verified);
        } catch (Exception e) {
            // A verification outage must never block a review — it just won't
            // carry the badge.
            log.warn("Verified-purchase check failed for product {}: {}", productId, e.getMessage());
            return false;
        }
    }

}