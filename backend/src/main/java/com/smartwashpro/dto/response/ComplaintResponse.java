package com.smartwashpro.dto.response;

import java.time.LocalDateTime;

public class ComplaintResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Long orderId;
    private String orderStatus;
    private Double orderTotalPrice;
    private String category;
    private String subject;
    private String description;
    private String priority;
    private String status;
    private Long assignedEmployeeId;
    private String assignedEmployeeName;
    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;

    public ComplaintResponse() {}

    public ComplaintResponse(Long id, Long customerId, String customerName, String customerEmail, String customerPhone,
                             Long orderId, String orderStatus, Double orderTotalPrice, String category, String subject,
                             String description, String priority, String status, Long assignedEmployeeId,
                             String assignedEmployeeName, String resolution, LocalDateTime createdAt,
                             LocalDateTime updatedAt, LocalDateTime resolvedAt, LocalDateTime closedAt) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.orderId = orderId;
        this.orderStatus = orderStatus;
        this.orderTotalPrice = orderTotalPrice;
        this.category = category;
        this.subject = subject;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.assignedEmployeeId = assignedEmployeeId;
        this.assignedEmployeeName = assignedEmployeeName;
        this.resolution = resolution;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.resolvedAt = resolvedAt;
        this.closedAt = closedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public Double getOrderTotalPrice() { return orderTotalPrice; }
    public void setOrderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }

    public String getAssignedEmployeeName() { return assignedEmployeeName; }
    public void setAssignedEmployeeName(String assignedEmployeeName) { this.assignedEmployeeName = assignedEmployeeName; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long customerId;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private Long orderId;
        private String orderStatus;
        private Double orderTotalPrice;
        private String category = "OTHER";
        private String subject;
        private String description;
        private String priority = "MEDIUM";
        private String status = "OPEN";
        private Long assignedEmployeeId;
        private String assignedEmployeeName;
        private String resolution;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime resolvedAt;
        private LocalDateTime closedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder customerId(Long customerId) { this.customerId = customerId; return this; }
        public Builder customerName(String customerName) { this.customerName = customerName; return this; }
        public Builder customerEmail(String customerEmail) { this.customerEmail = customerEmail; return this; }
        public Builder customerPhone(String customerPhone) { this.customerPhone = customerPhone; return this; }
        public Builder orderId(Long orderId) { this.orderId = orderId; return this; }
        public Builder orderStatus(String orderStatus) { this.orderStatus = orderStatus; return this; }
        public Builder orderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder assignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; return this; }
        public Builder assignedEmployeeName(String assignedEmployeeName) { this.assignedEmployeeName = assignedEmployeeName; return this; }
        public Builder resolution(String resolution) { this.resolution = resolution; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder resolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; return this; }
        public Builder closedAt(LocalDateTime closedAt) { this.closedAt = closedAt; return this; }

        public ComplaintResponse build() {
            return new ComplaintResponse(id, customerId, customerName, customerEmail, customerPhone,
                    orderId, orderStatus, orderTotalPrice, category, subject, description, priority, status,
                    assignedEmployeeId, assignedEmployeeName, resolution, createdAt, updatedAt, resolvedAt, closedAt);
        }
    }
}
