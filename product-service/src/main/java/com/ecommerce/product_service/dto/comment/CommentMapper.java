package com.ecommerce.product_service.dto.comment;

import com.ecommerce.product_service.model.Comment;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper {
    public CommentDto commentToCommentDto(Comment comment){
        return CommentDto.builder()
                .id(comment.getId())
                .createdDate(comment.getCreatedDate())
                .createdBy(comment.getCreatedBy())
                .text(comment.getText())
                .creator(comment.getCreator())
                .rating(comment.getRating())
                .build();
    }
}