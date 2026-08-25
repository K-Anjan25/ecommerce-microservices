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
}
