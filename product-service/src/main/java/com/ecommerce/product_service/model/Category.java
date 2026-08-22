package com.ecommerce.product_service.model;

import com.ecommerce.common.model.BaseModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

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
    private Long parentId;
    private Integer sortOrder;
    @OneToMany(mappedBy = "category")
    private List<Product> products;
}