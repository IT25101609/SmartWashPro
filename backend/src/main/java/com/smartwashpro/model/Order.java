package com.smartwashpro.model;

import com.smartwashpro.model.enums.OrderStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receptionist_id")
    private User receptionist;

    @Column(name = "branch_id")
    private Long branchId;

    private LocalDateTime orderDate;
    private LocalDate pickupDate;
    private LocalDate deliveryDate;

    private Double totalWeight;
    private Integer totalQuantity;
    private Double totalPrice;

    private String specialInstructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus orderStatus = OrderStatus.PLACED;

    private Long paymentId;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Order() {}

    public Order(Long id, Customer customer, User receptionist, Long branchId, LocalDateTime orderDate, LocalDate pickupDate, LocalDate deliveryDate, Double totalWeight, Integer totalQuantity, Double totalPrice, String specialInstructions, OrderStatus orderStatus, Long paymentId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.customer = customer;
        this.receptionist = receptionist;
        this.branchId = branchId;
        this.orderDate = orderDate;
        this.pickupDate = pickupDate;
        this.deliveryDate = deliveryDate;
        this.totalWeight = totalWeight;
        this.totalQuantity = totalQuantity;
        this.totalPrice = totalPrice;
        this.specialInstructions = specialInstructions;
        this.orderStatus = orderStatus != null ? orderStatus : OrderStatus.PLACED;
        this.paymentId = paymentId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (orderDate == null) orderDate = LocalDateTime.now();
        if (orderStatus == null) orderStatus = OrderStatus.PLACED;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public User getReceptionist() { return receptionist; }
    public void setReceptionist(User receptionist) { this.receptionist = receptionist; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public Double getTotalWeight() { return totalWeight; }
    public void setTotalWeight(Double totalWeight) { this.totalWeight = totalWeight; }
    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }
    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    public OrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; }
    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }
    public List<OrderStatusHistory> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(List<OrderStatusHistory> statusHistory) { this.statusHistory = statusHistory; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Customer customer;
        private User receptionist;
        private Long branchId;
        private LocalDateTime orderDate;
        private LocalDate pickupDate;
        private LocalDate deliveryDate;
        private Double totalWeight;
        private Integer totalQuantity;
        private Double totalPrice;
        private String specialInstructions;
        private OrderStatus orderStatus = OrderStatus.PLACED;
        private Long paymentId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder customer(Customer customer) { this.customer = customer; return this; }
        public Builder receptionist(User receptionist) { this.receptionist = receptionist; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder orderDate(LocalDateTime orderDate) { this.orderDate = orderDate; return this; }
        public Builder pickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; return this; }
        public Builder deliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; return this; }
        public Builder totalWeight(Double totalWeight) { this.totalWeight = totalWeight; return this; }
        public Builder totalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; return this; }
        public Builder totalPrice(Double totalPrice) { this.totalPrice = totalPrice; return this; }
        public Builder specialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; return this; }
        public Builder orderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; return this; }
        public Builder paymentId(Long paymentId) { this.paymentId = paymentId; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Order build() {
            return new Order(id, customer, receptionist, branchId, orderDate, pickupDate, deliveryDate, totalWeight, totalQuantity, totalPrice, specialInstructions, orderStatus, paymentId, createdAt, updatedAt);
        }
    }
}
