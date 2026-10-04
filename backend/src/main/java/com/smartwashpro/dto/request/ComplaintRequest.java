package com.smartwashpro.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ComplaintRequest {
    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Description is required")
    private String description;

    private String category;
    private String priority;
    private Long orderId;
    private Long customerId;
    private Long assignedEmployeeId;
    private String status;
    private String resolution;

    public ComplaintRequest() {}

    public ComplaintRequest(String subject, String description, String priority, Long orderId) {
        this.subject = subject;
        this.description = description;
        this.priority = priority;
        this.orderId = orderId;
    }

    public ComplaintRequest(String subject, String description, String category, String priority,
                            Long orderId, Long customerId, Long assignedEmployeeId) {
        this.subject = subject;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.orderId = orderId;
        this.customerId = customerId;
        this.assignedEmployeeId = assignedEmployeeId;
    }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
}
