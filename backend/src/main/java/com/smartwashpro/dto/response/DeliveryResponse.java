package com.smartwashpro.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DeliveryResponse {
    private Long id;
    private Long orderId;
    private Long driverId;
    private Long customerId;
    private String driverName;
    private String driverPhone;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String deliveryAddress;
    private String deliveryStatus;
    private String paymentStatus;
    private LocalDate deliveryDate;
    private String estimatedTime;
    private String orderStatus;
    private Double orderTotalPrice;
    private Long branchId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DeliveryResponse() {}

    public DeliveryResponse(Long id, Long orderId, Long driverId, Long customerId, String driverName, String customerName, String deliveryAddress, String deliveryStatus, String paymentStatus, LocalDate deliveryDate, LocalDateTime createdAt) {
        this.id = id;
        this.orderId = orderId;
        this.driverId = driverId;
        this.customerId = customerId;
        this.driverName = driverName;
        this.customerName = customerName;
        this.deliveryAddress = deliveryAddress;
        this.deliveryStatus = deliveryStatus;
        this.paymentStatus = paymentStatus;
        this.deliveryDate = deliveryDate;
        this.createdAt = createdAt;
    }

    public DeliveryResponse(Long id, Long orderId, Long driverId, Long customerId, String driverName, 
                            String driverPhone, String customerName, String customerPhone, String customerEmail, 
                            String deliveryAddress, String deliveryStatus, String paymentStatus, 
                            LocalDate deliveryDate, String estimatedTime, String orderStatus, 
                            Double orderTotalPrice, Long branchId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.orderId = orderId;
        this.driverId = driverId;
        this.customerId = customerId;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.customerEmail = customerEmail;
        this.deliveryAddress = deliveryAddress;
        this.deliveryStatus = deliveryStatus;
        this.paymentStatus = paymentStatus;
        this.deliveryDate = deliveryDate;
        this.estimatedTime = estimatedTime;
        this.orderStatus = orderStatus;
        this.orderTotalPrice = orderTotalPrice;
        this.branchId = branchId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getEstimatedTime() { return estimatedTime; }
    public void setEstimatedTime(String estimatedTime) { this.estimatedTime = estimatedTime; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public Double getOrderTotalPrice() { return orderTotalPrice; }
    public void setOrderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Long orderId;
        private Long driverId;
        private Long customerId;
        private String driverName;
        private String driverPhone;
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private String deliveryAddress;
        private String deliveryStatus;
        private String paymentStatus;
        private LocalDate deliveryDate;
        private String estimatedTime;
        private String orderStatus;
        private Double orderTotalPrice;
        private Long branchId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder orderId(Long orderId) { this.orderId = orderId; return this; }
        public Builder driverId(Long driverId) { this.driverId = driverId; return this; }
        public Builder customerId(Long customerId) { this.customerId = customerId; return this; }
        public Builder driverName(String driverName) { this.driverName = driverName; return this; }
        public Builder driverPhone(String driverPhone) { this.driverPhone = driverPhone; return this; }
        public Builder customerName(String customerName) { this.customerName = customerName; return this; }
        public Builder customerPhone(String customerPhone) { this.customerPhone = customerPhone; return this; }
        public Builder customerEmail(String customerEmail) { this.customerEmail = customerEmail; return this; }
        public Builder deliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; return this; }
        public Builder deliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; return this; }
        public Builder paymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; return this; }
        public Builder deliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; return this; }
        public Builder estimatedTime(String estimatedTime) { this.estimatedTime = estimatedTime; return this; }
        public Builder orderStatus(String orderStatus) { this.orderStatus = orderStatus; return this; }
        public Builder orderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public DeliveryResponse build() {
            return new DeliveryResponse(id, orderId, driverId, customerId, driverName, driverPhone, customerName, 
                    customerPhone, customerEmail, deliveryAddress, deliveryStatus, paymentStatus, deliveryDate, 
                    estimatedTime, orderStatus, orderTotalPrice, branchId, createdAt, updatedAt);
        }
    }
}
