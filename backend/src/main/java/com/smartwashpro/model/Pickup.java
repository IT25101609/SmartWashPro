package com.smartwashpro.model;

import com.smartwashpro.model.enums.PickupStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pickups")
public class Pickup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Employee driver;

    @Column(name = "branch_id")
    private Long branchId;

    private String pickupAddress;
    private LocalDate pickupDate;
    private String pickupTimeSlot;

    @Enumerated(EnumType.STRING)
    private PickupStatus pickupStatus = PickupStatus.REQUESTED;

    private String specialInstruction;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Pickup() {}

    public Pickup(Long id, Order order, Customer customer, Employee driver, Long branchId, String pickupAddress, LocalDate pickupDate, String pickupTimeSlot, PickupStatus pickupStatus, String specialInstruction, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.order = order;
        this.customer = customer;
        this.driver = driver;
        this.branchId = branchId;
        this.pickupAddress = pickupAddress;
        this.pickupDate = pickupDate;
        this.pickupTimeSlot = pickupTimeSlot;
        this.pickupStatus = pickupStatus != null ? pickupStatus : PickupStatus.REQUESTED;
        this.specialInstruction = specialInstruction;
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
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public Employee getDriver() { return driver; }
    public void setDriver(Employee driver) { this.driver = driver; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
    public String getPickupTimeSlot() { return pickupTimeSlot; }
    public void setPickupTimeSlot(String pickupTimeSlot) { this.pickupTimeSlot = pickupTimeSlot; }
    public PickupStatus getPickupStatus() { return pickupStatus; }
    public void setPickupStatus(PickupStatus pickupStatus) { this.pickupStatus = pickupStatus; }
    public String getSpecialInstruction() { return specialInstruction; }
    public void setSpecialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Order order;
        private Customer customer;
        private Employee driver;
        private Long branchId;
        private String pickupAddress;
        private LocalDate pickupDate;
        private String pickupTimeSlot;
        private PickupStatus pickupStatus = PickupStatus.REQUESTED;
        private String specialInstruction;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder order(Order order) { this.order = order; return this; }
        public Builder customer(Customer customer) { this.customer = customer; return this; }
        public Builder driver(Employee driver) { this.driver = driver; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder pickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; return this; }
        public Builder pickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; return this; }
        public Builder pickupTimeSlot(String pickupTimeSlot) { this.pickupTimeSlot = pickupTimeSlot; return this; }
        public Builder pickupStatus(PickupStatus pickupStatus) { this.pickupStatus = pickupStatus; return this; }
        public Builder specialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Pickup build() {
            return new Pickup(id, order, customer, driver, branchId, pickupAddress, pickupDate, pickupTimeSlot, pickupStatus, specialInstruction, createdAt, updatedAt);
        }
    }
}
