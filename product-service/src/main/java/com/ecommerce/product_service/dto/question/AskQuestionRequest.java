package com.ecommerce.product_service.dto.question;

import lombok.Getter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.UUID;

@Getter
public class AskQuestionRequest {

    @NotNull
    private UUID productId;

    @NotBlank
    @Size(min = 5, max = 500)
    private String text;
}
