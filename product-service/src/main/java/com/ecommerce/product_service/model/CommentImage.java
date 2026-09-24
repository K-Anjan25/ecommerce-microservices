package com.ecommerce.product_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

/**
 * A photo the customer attached to their review — shots of the product they
 * actually received. Stored as URLs/data URLs on the review (no binary blob
 * storage); rendered as a thumbnail strip on the review card.
 */
@Entity(name = "comment_images")
@Table
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class CommentImage extends AdvanceBaseModal {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
