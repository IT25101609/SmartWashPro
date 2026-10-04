package com.smartwashpro.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PickupResponse {
    private Long id;
    private Long orderId;
    private Long customerId;
    private Long driverId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String driverName;
    private String driverPhone;
    private String pickupAddress;
    private String pickupTimeSlot;
    private String pickupStatus;
    private String specialInstruction;
    private Long branchId;
    private LocalDate pickupDate;
    private String orderStatus;
    private Double orderTotalPrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PickupResponse() {}

    public PickupResponse(Long id, Long orderId, Long customerId, Long driverId, String customerName, 
                          String customerPhone, String customerEmail, String driverName, String driverPhone, 
                          String pickupAddress, String pickupTimeSlot, String pickupStatus, 
                          String specialInstruction, Long branchId, LocalDate pickupDate,
                          String orderStatus, Double orderTotalPrice, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.orderId = orderId;
        this.customerId = customerId;
        this.driverId = driverId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.customerEmail = customerEmail;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.pickupAddress = pickupAddress;
        this.pickupTimeSlot = pickupTimeSlot;
        this.pickupStatus = pickupStatus;
        this.specialInstruction = specialInstruction;
        this.branchId = branchId;
        this.pickupDate = pickupDate;
        this.orderStatus = orderStatus;
        this.orderTotalPrice = orderTotalPrice;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public String getPickupTimeSlot() { return pickupTimeSlot; }
    public void setPickupTimeSlot(String pickupTimeSlot) { this.pickupTimeSlot = pickupTimeSlot; }
    public String getPickupStatus() { return pickupStatus; }
    public void setPickupStatus(String pickupStatus) { this.pickupStatus = pickupStatus; }
    public String getSpecialInstruction() { return specialInstruction; }
    public void setSpecialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public Double getOrderTotalPrice() { return orderTotalPrice; }
    public void setOrderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Long orderId;
        private Long customerId;
        private Long driverId;
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private String driverName;
        private String driverPhone;
        private String pickupAddress;
        private String pickupTimeSlot;
        private String pickupStatus;
        private String specialInstruction;
        private Long branchId;
        private LocalDate pickupDate;
        private String orderStatus;
        private Double orderTotalPrice;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder orderId(Long orderId) { this.orderId = orderId; return this; }
        public Builder customerId(Long customerId) { this.customerId = customerId; return this; }
        public Builder driverId(Long driverId) { this.driverId = driverId; return this; }
        public Builder customerName(String customerName) { this.customerName = customerName; return this; }
        public Builder customerPhone(String customerPhone) { this.customerPhone = customerPhone; return this; }
        public Builder customerEmail(String customerEmail) { this.customerEmail = customerEmail; return this; }
        public Builder driverName(String driverName) { this.driverName = driverName; return this; }
        public Builder driverPhone(String driverPhone) { this.driverPhone = driverPhone; return this; }
        public Builder pickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; return this; }
        public Builder pickupTimeSlot(String pickupTimeSlot) { this.pickupTimeSlot = pickupTimeSlot; return this; }
        public Builder pickupStatus(String pickupStatus) { this.pickupStatus = pickupStatus; return this; }
        public Builder specialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder pickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; return this; }
        public Builder orderStatus(String orderStatus) { this.orderStatus = orderStatus; return this; }
        public Builder orderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public PickupResponse build() {
            return new PickupResponse(id, orderId, customerId, driverId, customerName, customerPhone, customerEmail, 
                    driverName, driverPhone, pickupAddress, pickupTimeSlot, pickupStatus, specialInstruction, branchId, 
                    pickupDate, orderStatus, orderTotalPrice, createdAt, updatedAt);
        }
    }
}
