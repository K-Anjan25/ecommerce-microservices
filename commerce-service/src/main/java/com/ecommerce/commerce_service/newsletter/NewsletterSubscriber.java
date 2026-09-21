package com.ecommerce.commerce_service.newsletter;

import lombok.*;

import javax.persistence.*;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Newsletter subscriber captured from the storefront footer form.
 * Subscribing is public and idempotent per email.
 */
@Entity
@Table(name = "newsletter_subscriber", indexes = {
        @Index(name = "idx_newsletter_email", columnList = "email", unique = true)
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class NewsletterSubscriber {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @NotBlank
    @Email
    @Size(max = 255)
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /** Where the signup came from, e.g. FOOTER, CHECKOUT. */
    @Column(nullable = false, length = 30)
    private String source;

    /** False when the customer unsubscribes; the email is kept for audit. */
    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
