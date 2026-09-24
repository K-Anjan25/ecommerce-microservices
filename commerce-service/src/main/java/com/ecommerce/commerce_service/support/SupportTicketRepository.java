package com.ecommerce.commerce_service.support;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    Optional<SupportTicket> findByTicketRef(String ticketRef);

    /** Newest first for the staff queue. */
    List<SupportTicket> findTop200ByOrderByCreatedAtDesc();

    List<SupportTicket> findTop200ByStatusOrderByCreatedAtDesc(String status);

    boolean existsByTicketRef(String ticketRef);
}
