package com.ecommerce.commerce_service.support;

import lombok.*;

import javax.persistence.*;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Customer support ticket raised from the storefront Help/Contact surface.
 * Tickets are public-creatable (guests included) and worked by staff.
 */
@Entity
@Table(name = "support_ticket", indexes = {
        // columnList entries must be the @Column names (snake_case), NOT the
        // property names — camelCase here crashes Hibernate at boot with
        // "database column not found" (this exact bug took the service down).
        @Index(name = "idx_support_ticket_ref", columnList = "ticket_ref", unique = true),
        @Index(name = "idx_support_ticket_status_created", columnList = "status, created_at")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SupportTicket {

    public static final String STATUS_OPEN = "OPEN";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_RESOLVED = "RESOLVED";

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    /** Customer-facing reference, e.g. SUP-8F3K2Q. */
    @Column(name = "ticket_ref", nullable = false, unique = true, length = 20)
    private String ticketRef;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @NotBlank
    @Email
    @Size(max = 180)
    @Column(nullable = false, length = 180)
    private String email;

    /** Topic chosen on the contact form, e.g. "Returns & refunds". */
    @NotBlank
    @Size(max = 60)
    @Column(nullable = false, length = 60)
    private String topic;

    /** Optional order reference the ticket is about. */
    @Column(name = "order_number", length = 64)
    private String orderNumber;

    @NotBlank
    @Size(min = 20, max = 4000)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /** OPEN → IN_PROGRESS → RESOLVED. */
    @Column(nullable = false, length = 20)
    private String status;

    /** Set from the gateway-injected userId header when the reporter is signed in. */
    @Column(name = "customer_id", length = 64)
    private String customerId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** NORMAL | HIGH — Cartly Plus members get the priority support lane. */
    @Column(nullable = false, length = 10)
    private String priority = "NORMAL";
}
