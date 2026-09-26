package com.ecommerce.product_service.dto.comment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;
import java.util.UUID;

@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {
    private UUID productId;
    private String text;
    private Integer rating;
    /** Optional review photos as data:/https URLs (max 8, server-validated). */
    private List<String> images;
}
