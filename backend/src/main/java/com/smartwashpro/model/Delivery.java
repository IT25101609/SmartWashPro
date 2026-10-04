package com.smartwashpro.model;

import com.smartwashpro.model.enums.DeliveryPaymentStatus;
import com.smartwashpro.model.enums.DeliveryStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
public class Delivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Employee driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    private String deliveryAddress;
    private LocalDate deliveryDate;
    private String estimatedTime;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private DeliveryPaymentStatus paymentStatus = DeliveryPaymentStatus.NOT_APPLICABLE;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Delivery() {}

    public Delivery(Long id, Order order, Employee driver, Customer customer, String deliveryAddress, LocalDate deliveryDate, String estimatedTime, DeliveryStatus deliveryStatus, DeliveryPaymentStatus paymentStatus, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.order = order;
        this.driver = driver;
        this.customer = customer;
        this.deliveryAddress = deliveryAddress;
        this.deliveryDate = deliveryDate;
        this.estimatedTime = estimatedTime;
        this.deliveryStatus = deliveryStatus != null ? deliveryStatus : DeliveryStatus.PENDING;
        this.paymentStatus = paymentStatus != null ? paymentStatus : DeliveryPaymentStatus.NOT_APPLICABLE;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public Employee getDriver() { return driver; }
    public void setDriver(Employee driver) { this.driver = driver; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getEstimatedTime() { return estimatedTime; }
    public void setEstimatedTime(String estimatedTime) { this.estimatedTime = estimatedTime; }
    public DeliveryStatus getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(DeliveryStatus deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    public DeliveryPaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(DeliveryPaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Order order;
        private Employee driver;
        private Customer customer;
        private String deliveryAddress;
        private LocalDate deliveryDate;
        private String estimatedTime;
        private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;
        private DeliveryPaymentStatus paymentStatus = DeliveryPaymentStatus.NOT_APPLICABLE;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder order(Order order) { this.order = order; return this; }
        public Builder driver(Employee driver) { this.driver = driver; return this; }
        public Builder customer(Customer customer) { this.customer = customer; return this; }
        public Builder deliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; return this; }
        public Builder deliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; return this; }
        public Builder estimatedTime(String estimatedTime) { this.estimatedTime = estimatedTime; return this; }
        public Builder deliveryStatus(DeliveryStatus deliveryStatus) { this.deliveryStatus = deliveryStatus; return this; }
        public Builder paymentStatus(DeliveryPaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Delivery build() {
            return new Delivery(id, order, driver, customer, deliveryAddress, deliveryDate, estimatedTime, deliveryStatus, paymentStatus, createdAt, updatedAt);
        }
    }
}
