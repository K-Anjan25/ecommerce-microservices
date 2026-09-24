package com.ecommerce.product_service.dto.question;

import lombok.Getter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
public class AnswerQuestionRequest {

    @NotBlank
    @Size(min = 2, max = 2000)
    private String answer;
}
