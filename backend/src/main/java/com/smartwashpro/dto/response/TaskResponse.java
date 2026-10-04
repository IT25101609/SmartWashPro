package com.smartwashpro.dto.response;

import java.time.LocalDateTime;

public class TaskResponse {
    private Long id;
    private Long employeeId;
    private Long orderId;
    private String employeeName;
    private String employeeRole;
    private String employeePhone;
    private Long branchId;
    private String branchName;
    private String taskType;
    private String taskTitle;
    private String title;
    private String taskDescription;
    private String description;
    private String priority;
    private String taskStatus;
    private String assignedByName;
    private LocalDateTime assignedDate;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TaskResponse() {}

    public TaskResponse(Long id, Long employeeId, Long orderId, String employeeName, String employeeRole,
                        String employeePhone, Long branchId, String branchName, String taskType,
                        String taskTitle, String taskDescription, String priority, String taskStatus,
                        String assignedByName, LocalDateTime assignedDate, LocalDateTime dueDate,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.orderId = orderId;
        this.employeeName = employeeName;
        this.employeeRole = employeeRole;
        this.employeePhone = employeePhone;
        this.branchId = branchId;
        this.branchName = branchName;
        this.taskType = taskType;
        this.taskTitle = taskTitle;
        this.title = taskTitle;
        this.taskDescription = taskDescription;
        this.description = taskDescription;
        this.priority = priority;
        this.taskStatus = taskStatus;
        this.assignedByName = assignedByName;
        this.assignedDate = assignedDate;
        this.dueDate = dueDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getEmployeeRole() { return employeeRole; }
    public void setEmployeeRole(String employeeRole) { this.employeeRole = employeeRole; }
    public String getEmployeePhone() { return employeePhone; }
    public void setEmployeePhone(String employeePhone) { this.employeePhone = employeePhone; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }
    public String getTaskTitle() { return taskTitle != null ? taskTitle : title; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; this.title = taskTitle; }
    public String getTitle() { return title != null ? title : taskTitle; }
    public void setTitle(String title) { this.title = title; this.taskTitle = title; }
    public String getTaskDescription() { return taskDescription != null ? taskDescription : description; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; this.description = taskDescription; }
    public String getDescription() { return description != null ? description : taskDescription; }
    public void setDescription(String description) { this.description = description; this.taskDescription = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getTaskStatus() { return taskStatus; }
    public void setTaskStatus(String taskStatus) { this.taskStatus = taskStatus; }
    public String getAssignedByName() { return assignedByName; }
    public void setAssignedByName(String assignedByName) { this.assignedByName = assignedByName; }
    public LocalDateTime getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDateTime assignedDate) { this.assignedDate = assignedDate; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long employeeId;
        private Long orderId;
        private String employeeName;
        private String employeeRole;
        private String employeePhone;
        private Long branchId;
        private String branchName;
        private String taskType;
        private String taskTitle;
        private String taskDescription;
        private String priority;
        private String taskStatus;
        private String assignedByName;
        private LocalDateTime assignedDate;
        private LocalDateTime dueDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder employeeId(Long employeeId) { this.employeeId = employeeId; return this; }
        public Builder orderId(Long orderId) { this.orderId = orderId; return this; }
        public Builder employeeName(String employeeName) { this.employeeName = employeeName; return this; }
        public Builder employeeRole(String employeeRole) { this.employeeRole = employeeRole; return this; }
        public Builder employeePhone(String employeePhone) { this.employeePhone = employeePhone; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder taskType(String taskType) { this.taskType = taskType; return this; }
        public Builder taskTitle(String taskTitle) { this.taskTitle = taskTitle; return this; }
        public Builder title(String title) { this.taskTitle = title; return this; }
        public Builder taskDescription(String taskDescription) { this.taskDescription = taskDescription; return this; }
        public Builder description(String description) { this.taskDescription = description; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder taskStatus(String taskStatus) { this.taskStatus = taskStatus; return this; }
        public Builder assignedByName(String assignedByName) { this.assignedByName = assignedByName; return this; }
        public Builder assignedDate(LocalDateTime assignedDate) { this.assignedDate = assignedDate; return this; }
        public Builder dueDate(LocalDateTime dueDate) { this.dueDate = dueDate; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public TaskResponse build() {
            return new TaskResponse(id, employeeId, orderId, employeeName, employeeRole, employeePhone,
                    branchId, branchName, taskType, taskTitle, taskDescription, priority, taskStatus,
                    assignedByName, assignedDate, dueDate, createdAt, updatedAt);
        }
    }
}
