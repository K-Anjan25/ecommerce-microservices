package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.ProductCatalogClient;
import com.ecommerce.commerce_service.client.StoreSettingsClient;
import com.ecommerce.commerce_service.dto.store.StoreBrandDto;
import com.ecommerce.commerce_service.dto.catalog.ProductSummaryDto;
import com.ecommerce.commerce_service.exception.OrderNotFoundException;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderItem;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Generates PDF invoices for orders (OpenPDF) and emails them as attachments
 * through the existing notification exchange. Amounts are rendered as "Rs."
 * because the built-in Helvetica font has no rupee glyph.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final OrderRepository orderRepository;
    private final ProductCatalogClient productCatalogClient;
    private final StoreSettingsClient storeSettingsClient;
    private final RabbitMQMessageProducer rabbitMQMessageProducer;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email}")
    private String sendEmailRoutingKey;

    public byte[] getOrderInvoicePdf(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));
        return generateInvoicePdf(order);
    }

    /** Best-effort: never fails the caller (payment flow) on invoice problems. */
    public void emailInvoice(Order order) {
        if (order.getCustomerEmail() == null || order.getCustomerEmail().isBlank()) {
            return;
        }
        try {
            StoreBrandDto brand = brand();
            byte[] pdf = generateInvoicePdf(order);
            rabbitMQMessageProducer.publish(
                    new EmailRequest(
                            "Thank you for your order! The invoice for order " + order.getId()
                                    + " is attached.",
                            order.getCustomerEmail(),
                            storeName(brand).toUpperCase() + " - Invoice for order #" + order.getId(),
                            "invoice-" + order.getId() + ".pdf",
                            Base64.getEncoder().encodeToString(pdf)),
                    notificationExchange,
                    sendEmailRoutingKey);
            log.info("Invoice email queued for order {}", order.getId());
        } catch (Exception e) {
            log.error("Failed to email invoice for order {}", order.getId(), e);
        }
    }

    public byte[] generateInvoicePdf(Order order) {
        Map<UUID, String> productNames = productNames(order);
        StoreBrandDto brand = brand();
        String storeName = storeName(brand);

        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD);
            Font headingFont = new Font(Font.HELVETICA, 13, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.ITALIC);

            document.add(new Paragraph(storeName, titleFont));
            if (brand != null && brand.getStoreTagline() != null && !brand.getStoreTagline().isBlank()) {
                document.add(new Paragraph(brand.getStoreTagline(), smallFont));
            }
            document.add(new Paragraph("Tax Invoice", new Font(Font.HELVETICA, 12, Font.ITALIC)));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("Invoice No: INV-" + order.getId(), normalFont));
            document.add(new Paragraph("Order ID: " + order.getId(), normalFont));
            if (order.getCreatedDate() != null) {
                document.add(new Paragraph("Date: " + DATE_FORMAT.format(order.getCreatedDate()), normalFont));
            }
            if (order.getCustomerEmail() != null && !order.getCustomerEmail().isBlank()) {
                document.add(new Paragraph("Billed to: " + order.getCustomerEmail(), normalFont));
            }
            if (order.getAddress() != null) {
                String address = order.getAddress().getAddressDetail() + ", "
                        + order.getAddress().getDistrict() + ", "
                        + order.getAddress().getState();
                document.add(new Paragraph("Address: " + address, normalFont));
            }
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("Order lines", headingFont));
            document.add(buildItemsTable(order, productNames));
            document.add(Chunk.NEWLINE);
            document.add(buildTotalsTable(order));
            document.add(Chunk.NEWLINE);
            if (brand != null && brand.getSupportEmail() != null && !brand.getSupportEmail().isBlank()) {
                document.add(new Paragraph("Questions? Contact " + brand.getSupportEmail(), smallFont));
            }
            String footerNote = brand == null || brand.getInvoiceFooterNote() == null
                    || brand.getInvoiceFooterNote().isBlank()
                    ? "This is a system generated invoice."
                    : brand.getInvoiceFooterNote();
            document.add(new Paragraph(footerNote, smallFont));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate invoice for order " + order.getId(), e);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
        return out.toByteArray();
    }

    /**
     * Branding is optional by design: any problem reaching product-service or
     * reading the settings falls back to the platform defaults so invoicing
     * never depends on a branding lookup.
     */
    private StoreBrandDto brand() {
        try {
            return storeSettingsClient.getBrand();
        } catch (Exception e) {
            log.warn("Store branding unavailable, falling back to defaults: {}", e.getMessage());
            return null;
        }
    }

    private String storeName(StoreBrandDto brand) {
        if (brand != null && brand.getStoreName() != null && !brand.getStoreName().isBlank()) {
            return brand.getStoreName().trim();
        }
        return "Cartly";
    }

    private PdfPTable buildItemsTable(Order order, Map<UUID, String> productNames) {
        PdfPTable table = new PdfPTable(new float[]{5f, 1.5f, 2.5f, 2.5f});
        table.setWidthPercentage(100);
        table.addCell(headerCell("Product"));
        table.addCell(headerCell("Qty"));
        table.addCell(headerCell("Unit price"));
        table.addCell(headerCell("Total"));
        for (OrderItem item : order.getItems()) {
            String label = productNames.getOrDefault(item.getProductId(),
                    "Product " + shortId(item.getProductId()));
            BigDecimal price = item.getPrice() == null ? BigDecimal.ZERO : item.getPrice();
            int quantity = item.getQuantity() == null ? 1 : item.getQuantity();
            table.addCell(new PdfPCell(new Phrase(label)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(quantity))));
            table.addCell(rightCell(money(price)));
            table.addCell(rightCell(money(price.multiply(BigDecimal.valueOf(quantity)))));
        }
        return table;
    }

    private PdfPTable buildTotalsTable(Order order) {
        PdfPTable table = new PdfPTable(new float[]{8f, 3f});
        table.setWidthPercentage(100);

        BigDecimal subtotal = order.getItems().stream()
                .map(item -> item.getPrice() == null ? BigDecimal.ZERO
                        : item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity() == null ? 1 : item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        addTotalsRow(table, "Subtotal", subtotal, false);
        addTotalsRow(table, "Shipping", nvl(order.getShippingAmount()), false);
        if (order.getGiftWrapFee() != null && order.getGiftWrapFee().compareTo(BigDecimal.ZERO) > 0) {
            addTotalsRow(table, "Gift wrap", order.getGiftWrapFee(), false);
        }
        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalsRow(table, "Coupon discount", order.getDiscountAmount().negate(), false);
        }
        if (order.getLoyaltyDiscountAmount() != null && order.getLoyaltyDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalsRow(table, "Loyalty (" + order.getLoyaltyPointsRedeemed() + " points)",
                    order.getLoyaltyDiscountAmount().negate(), false);
        }
        addTotalsRow(table, "Tax", nvl(order.getTaxAmount()), false);
        if (order.getGiftCardAmount() != null && order.getGiftCardAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalsRow(table, "Gift card ending " + order.getGiftCardCodeLast4(),
                    order.getGiftCardAmount().negate(), false);
        }
        addTotalsRow(table, "Amount due", nvl(order.getTotalAmount()), true);
        return table;
    }

    private void addTotalsRow(PdfPTable table, String label, BigDecimal amount, boolean bold) {
        Font font = bold ? new Font(Font.HELVETICA, 10, Font.BOLD) : new Font(Font.HELVETICA, 10, Font.NORMAL);
        table.addCell(new PdfPCell(new Phrase(label, font)));
        PdfPCell amountCell = new PdfPCell(new Phrase(money(amount), font));
        amountCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(amountCell);
    }

    private PdfPCell headerCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 10, Font.BOLD)));
        if ("Total".equals(text) || "Unit price".equals(text)) {
            cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        }
        return cell;
    }

    private PdfPCell rightCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return cell;
    }

    private Map<UUID, String> productNames(Order order) {
        try {
            List<UUID> ids = order.getItems().stream()
                    .map(OrderItem::getProductId)
                    .distinct()
                    .collect(Collectors.toList());
            if (ids.isEmpty()) {
                return Map.of();
            }
            String joined = ids.stream().map(UUID::toString).collect(Collectors.joining(","));
            return productCatalogClient.findByIds(joined).stream()
                    .collect(Collectors.toMap(ProductSummaryDto::getId, ProductSummaryDto::getName));
        } catch (Exception e) {
            log.warn("Could not fetch product names for invoice ({}); falling back to ids", e.getMessage());
            return Map.of();
        }
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String money(BigDecimal value) {
        return String.format("Rs. %,.2f", nvl(value));
    }

    private String shortId(UUID id) {
        return id == null ? "?" : id.toString().substring(0, 8);
    }
}
