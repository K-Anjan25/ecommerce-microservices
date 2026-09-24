package com.ecommerce.product_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/**
 * Customer review of a product (text + rating + creator + optional photos).
 */
@Entity(name = "comments")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(exclude = {"product", "images"})
@ToString(exclude = {"product", "images"})
@SuperBuilder
public class Comment extends AdvanceBaseModal {
    private String text;
    private Integer rating;
    @ManyToOne()
    @JoinColumn(name = "product_id")
    private Product product;

    private String creator;

    /** Author's user id (server-derived from the gateway identity header). */
    @Column(name = "user_id")
    private java.util.UUID userId;

    /** True when commerce-service confirms an active order for this user+product. */
    @Column(name = "verified_purchase", nullable = false)
    private boolean verifiedPurchase = false;

    /** Photos the customer attached of the product they received. */
    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<CommentImage> images = new ArrayList<>();
}
