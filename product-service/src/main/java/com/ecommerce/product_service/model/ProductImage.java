package com.ecommerce.product_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import java.util.UUID;

@Entity(name = "product_images")
@Table
@Data
@EqualsAndHashCode(exclude = "product")
@ToString(exclude = "product")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private String url;

    private Integer sortOrder;

    /** When set, the shot is of this specific variant (colourway/config). */
    private UUID variantId;

    /**
     * Shot role: front | side | back | detail | box | lifestyle | gallery.
     * Gallery rendering groups and labels thumbnails by this value.
     */
    private String angle;

    private String altText;
}
