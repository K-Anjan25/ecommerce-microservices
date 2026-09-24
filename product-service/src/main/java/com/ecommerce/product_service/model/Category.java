package com.ecommerce.product_service.model;

import com.ecommerce.common.model.BaseModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import java.util.List;

@Entity(name = "categories")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(exclude = "products")
@ToString(exclude = "products")
@SuperBuilder
public class Category extends BaseModel {
    private String name;
    private String slug;

    /**
     * Multi-locale content overrides as JSON: {"hi":{"name":"...","description":"..."}, ...}.
     * The base columns stay the source of truth (English); missing languages fall back.
     */
    @Column(name = "translations", length = 8000)
    private String translations;
    private String description;
    private String imageUrl;
    private Long parentId;
    private Integer sortOrder;
    @OneToMany(mappedBy = "category")
    private List<Product> products;
}