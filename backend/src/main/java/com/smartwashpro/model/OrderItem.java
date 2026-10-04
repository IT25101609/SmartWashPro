package com.smartwashpro.model;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", nullable = false)
    private LaundryService laundryService;

    private String serviceName;
    private Double quantity;
    private Double unitPrice;
    private Double subtotal;
    private String specialInstruction;

    public OrderItem() {}

    public OrderItem(Long id, Order order, LaundryService laundryService, String serviceName, Double quantity, Double unitPrice, Double subtotal, String specialInstruction) {
        this.id = id;
        this.order = order;
        this.laundryService = laundryService;
        this.serviceName = serviceName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.specialInstruction = specialInstruction;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public LaundryService getLaundryService() { return laundryService; }
    public void setLaundryService(LaundryService laundryService) { this.laundryService = laundryService; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public String getSpecialInstruction() { return specialInstruction; }
    public void setSpecialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Order order;
        private LaundryService laundryService;
        private String serviceName;
        private Double quantity;
        private Double unitPrice;
        private Double subtotal;
        private String specialInstruction;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder order(Order order) { this.order = order; return this; }
        public Builder laundryService(LaundryService laundryService) { this.laundryService = laundryService; return this; }
        public Builder serviceName(String serviceName) { this.serviceName = serviceName; return this; }
        public Builder quantity(Double quantity) { this.quantity = quantity; return this; }
        public Builder unitPrice(Double unitPrice) { this.unitPrice = unitPrice; return this; }
        public Builder subtotal(Double subtotal) { this.subtotal = subtotal; return this; }
        public Builder specialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; return this; }

        public OrderItem build() {
            return new OrderItem(id, order, laundryService, serviceName, quantity, unitPrice, subtotal, specialInstruction);
        }
    }
}
