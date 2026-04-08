package com.ecommerce.order_service.model;

import com.ecommerce.common.model.BaseModel;
import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity(name = "orders")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends AdvanceBaseModal {

    private UUID customerId;
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private OrderAddress address;

    @OneToMany(mappedBy = "order",cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private List<OrderItem> items;
}