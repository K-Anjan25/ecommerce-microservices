package com.ecommerce.product_service.dto.question;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private UUID id;
    private String text;
    private String askedBy;
    private LocalDateTime createdDate;
    private String answer;
    private String answeredBy;
    private LocalDateTime answeredAt;
    private UUID productId;
}
