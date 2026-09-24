package com.ecommerce.product_service.dto.comment;

import com.ecommerce.product_service.model.Comment;
import com.ecommerce.product_service.model.CommentImage;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

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
                .verifiedPurchase(comment.isVerifiedPurchase())
                .images(comment.getImages() == null ? List.of()
                        : comment.getImages().stream().map(this::imageToDto).collect(Collectors.toList()))
                .build();
    }

    public CommentImageDto imageToDto(CommentImage image){
        return new CommentImageDto(
                image.getId() == null ? null : image.getId().toString(),
                image.getImageUrl(),
                image.getAltText(),
                image.getSortOrder());
    }
}