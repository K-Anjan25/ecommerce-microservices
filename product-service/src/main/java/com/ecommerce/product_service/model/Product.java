package com.ecommerce.product_service.model;


import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Entity(name = "products")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(exclude = {"variants", "images", "comments"})
@ToString(exclude = {"variants", "images", "comments"})
@SuperBuilder
@SQLDelete(sql = "UPDATE products SET deleted = true WHERE id=?")
@Where(clause = "deleted=false")
public class Product extends AdvanceBaseModal{

    private String name;
    private BigDecimal unitPrice;

    @Column(columnDefinition="TEXT")
    private String description;

    @ManyToOne()
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable=false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean deleted;

    private String imageUrl;

    private String brand;

    private BigDecimal originalPrice;

    private String badge;

    private boolean featured;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ProductImage> images;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ProductVariant> variants;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<Comment> comments;
}
