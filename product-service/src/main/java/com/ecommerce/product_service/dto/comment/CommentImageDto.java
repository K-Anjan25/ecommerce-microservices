package com.ecommerce.product_service.dto.comment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class CommentImageDto {
    private String id;
    private String imageUrl;
    private String altText;
    private Integer sortOrder;
}
