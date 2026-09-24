package com.ecommerce.product_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Amazon-style customer Q&A: anyone can read, signed-in customers ask,
 * staff answer publicly. One row = one question (plus its answer once
 * given), rendered as a Q&A pair on the product page.
 */
@Entity(name = "questions")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(exclude = "product")
@ToString(exclude = "product")
@SuperBuilder
public class Question extends AdvanceBaseModal {

    private String text;

    /** Display name of the asker (server-derived from the gateway identity). */
    private String askedBy;

    /** Asker's user id (server-derived, never client input). */
    @Column(name = "user_id")
    private java.util.UUID userId;

    /** Staff answer — null while the question is unanswered. */
    private String answer;

    /** Staff member who answered (server-derived). */
    @Column(name = "answered_by")
    private String answeredBy;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @ManyToOne()
    @JoinColumn(name = "product_id")
    private Product product;
}
