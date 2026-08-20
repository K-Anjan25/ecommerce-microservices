package com.ecommerce.product_service.dto.comment;

import lombok.Getter;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
public class CreateCommentRequest {
    @NotNull
    private UUID productId;
    @NotNull
    private String text;
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;
}