package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.Pagination;
import com.ecommerce.commerce_service.dto.order.OrderDto;
import com.ecommerce.commerce_service.dto.order.CreateOrderRequest;
import com.ecommerce.commerce_service.dto.tracking.OrderStatusHistoryDto;
import com.ecommerce.commerce_service.service.InvoiceService;
import com.ecommerce.commerce_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {
    private final OrderService orderService;
    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@Valid @RequestBody CreateOrderRequest createOrderRequest){
        log.info("create order request was called");
        return new ResponseEntity<>(orderService.createOrder(createOrderRequest),HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<Pagination<OrderDto>> getAll(@RequestParam(required = false,defaultValue = "0")  int pageNo,
                                                       @RequestParam(required = false,defaultValue = "10") int pageSize){
        return ResponseEntity.ok(orderService.getAllOrders(pageNo,pageSize));
    }

    /**
     * Order history of the signed-in customer. The gateway AuthFilter injects
     * the userId header on this route; a missing header means the call did not
     * come through the authenticated gateway path.
     */
    @GetMapping("/my")
    public ResponseEntity<List<OrderDto>> getMyOrders(@RequestHeader(value = "userId", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(orderService.getOrdersByCustomer(UUID.fromString(userId)));
    }


    /** Guest tracking uses a high-entropy capability in a header, never a query string. */
    @GetMapping("/{orderId}/guest")
    public ResponseEntity<OrderDto> getGuestOrder(@PathVariable UUID orderId,
            @RequestHeader(value = "X-Checkout-Token", required = false) String checkoutToken) {
        return ResponseEntity.ok(orderService.getGuestOrder(orderId, checkoutToken));
    }

    @GetMapping("/{orderId}/guest/track")
    public ResponseEntity<List<OrderStatusHistoryDto>> getGuestOrderTracking(@PathVariable UUID orderId,
            @RequestHeader(value = "X-Checkout-Token", required = false) String checkoutToken) {
        orderService.getGuestOrder(orderId, checkoutToken);
        return ResponseEntity.ok(orderService.getOrderTracking(orderId));
    }


    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<OrderDto> cancelMyOrder(@PathVariable UUID orderId) {
        UUID customerId = UUID.fromString(String.valueOf(
                SecurityContextHolder.getContext().getAuthentication().getPrincipal()));
        return ResponseEntity.ok(orderService.cancelPendingOrder(orderId, customerId, null));
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestParam OrderStatus status,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(orderService.updateOrderStatusByAdmin(orderId, status, note));
    }

    @PostMapping("/{orderId}/guest/cancel")
    public ResponseEntity<OrderDto> cancelGuestOrder(@PathVariable UUID orderId,
            @RequestHeader(value = "X-Checkout-Token", required = false) String checkoutToken) {
        return ResponseEntity.ok(orderService.cancelPendingOrder(orderId, null, checkoutToken));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDto> getById(@PathVariable UUID orderId){
        OrderDto order = orderService.getOrderById(orderId);
        if (!canAccess(order)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{orderId}/track")
    public ResponseEntity<List<OrderStatusHistoryDto>> trackOrder(@PathVariable UUID orderId){
        OrderDto order = orderService.getOrderById(orderId);
        if (!canAccess(order)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(orderService.getOrderTracking(orderId));
    }

    /** Regenerates the invoice PDF from current order data (owner or staff only). */
    @GetMapping("/{orderId}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable UUID orderId) {
        OrderDto order = orderService.getOrderById(orderId);
        if (!canAccess(order)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        byte[] pdf = invoiceService.getOrderInvoicePdf(orderId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + orderId + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @GetMapping("/stats/bestsellers")
    public ResponseEntity<Map<UUID, Long>> getBestsellers(){
        return ResponseEntity.ok(orderService.getBestsellers());
    }

    /** Phase 9 analytics for the admin dashboard (admin-only). */
    @GetMapping("/stats/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<com.ecommerce.commerce_service.dto.stats.DashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(orderService.getDashboardStats());
    }

    @GetMapping("/bought-together/{productId}")
    public ResponseEntity<List<UUID>> getBoughtTogether(@PathVariable UUID productId){
        return ResponseEntity.ok(orderService.getBoughtTogether(productId));
    }

    private boolean canAccess(OrderDto order) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return false;
        boolean staff = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_MANAGER")
                        || role.equals("ROLE_SUPER_ADMIN"));
        if (staff) return true;
        return order.getCustomerId() != null
                && order.getCustomerId().toString().equals(String.valueOf(authentication.getPrincipal()));
    }
}
