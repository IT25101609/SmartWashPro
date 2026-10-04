package com.smartwashpro.dto.response;

import java.time.LocalDateTime;

public class PaymentResponse {
    private Long id;
    private Long orderId;
    private Long customerId;
    private String customerName;
    private Double amount;
    private String paymentMethod;
    private String paymentStatus;
    private String transactionReference;
    private LocalDateTime paymentDate;
    private String receiptNumber;
    private LocalDateTime createdAt;
    private Long branchId;
    private String branchName;
    private String orderStatus;

    public PaymentResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long orderId;
        private Long customerId;
        private String customerName;
        private Double amount;
        private String paymentMethod;
        private String paymentStatus;
        private String transactionReference;
        private LocalDateTime paymentDate;
        private String receiptNumber;
        private LocalDateTime createdAt;
        private Long branchId;
        private String branchName;
        private String orderStatus;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder orderId(Long orderId) { this.orderId = orderId; return this; }
        public Builder customerId(Long customerId) { this.customerId = customerId; return this; }
        public Builder customerName(String customerName) { this.customerName = customerName; return this; }
        public Builder amount(Double amount) { this.amount = amount; return this; }
        public Builder paymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public Builder paymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; return this; }
        public Builder transactionReference(String transactionReference) { this.transactionReference = transactionReference; return this; }
        public Builder paymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; return this; }
        public Builder receiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder orderStatus(String orderStatus) { this.orderStatus = orderStatus; return this; }

        public PaymentResponse build() {
            PaymentResponse instance = new PaymentResponse();
            instance.id = this.id;
            instance.orderId = this.orderId;
            instance.customerId = this.customerId;
            instance.customerName = this.customerName;
            instance.amount = this.amount;
            instance.paymentMethod = this.paymentMethod;
            instance.paymentStatus = this.paymentStatus;
            instance.transactionReference = this.transactionReference;
            instance.paymentDate = this.paymentDate;
            instance.receiptNumber = this.receiptNumber;
            instance.createdAt = this.createdAt;
            instance.branchId = this.branchId;
            instance.branchName = this.branchName;
            instance.orderStatus = this.orderStatus;
            return instance;
        }
    }
}
