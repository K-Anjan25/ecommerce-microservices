package com.ecommerce.product_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.util.List;

@Entity(name = "comments")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(exclude = "product")
@ToString(exclude = "product")
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
}
