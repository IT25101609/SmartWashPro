package com.smartwashpro.model;

import com.smartwashpro.model.enums.TaskPriority;
import com.smartwashpro.model.enums.TaskStatus;
import com.smartwashpro.model.enums.TaskType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_tasks")
public class EmployeeTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Enumerated(EnumType.STRING)
    private TaskType taskType;

    private String taskDescription;

    @Enumerated(EnumType.STRING)
    private TaskPriority priority = TaskPriority.MEDIUM;

    private LocalDateTime assignedDate;
    private LocalDateTime dueDate;

    @Enumerated(EnumType.STRING)
    private TaskStatus taskStatus = TaskStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id")
    private User assignedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EmployeeTask() {}

    public EmployeeTask(Long id, Employee employee, Order order, TaskType taskType, String taskDescription, TaskPriority priority, LocalDateTime assignedDate, LocalDateTime dueDate, TaskStatus taskStatus, User assignedBy, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.employee = employee;
        this.order = order;
        this.taskType = taskType;
        this.taskDescription = taskDescription;
        this.priority = priority != null ? priority : TaskPriority.MEDIUM;
        this.assignedDate = assignedDate;
        this.dueDate = dueDate;
        this.taskStatus = taskStatus != null ? taskStatus : TaskStatus.PENDING;
        this.assignedBy = assignedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public TaskType getTaskType() { return taskType; }
    public void setTaskType(TaskType taskType) { this.taskType = taskType; }
    public String getTaskDescription() { return taskDescription; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }
    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }
    public LocalDateTime getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDateTime assignedDate) { this.assignedDate = assignedDate; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public TaskStatus getTaskStatus() { return taskStatus; }
    public void setTaskStatus(TaskStatus taskStatus) { this.taskStatus = taskStatus; }
    public User getAssignedBy() { return assignedBy; }
    public void setAssignedBy(User assignedBy) { this.assignedBy = assignedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Employee employee;
        private Order order;
        private TaskType taskType;
        private String taskDescription;
        private TaskPriority priority = TaskPriority.MEDIUM;
        private LocalDateTime assignedDate;
        private LocalDateTime dueDate;
        private TaskStatus taskStatus = TaskStatus.PENDING;
        private User assignedBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder employee(Employee employee) { this.employee = employee; return this; }
        public Builder order(Order order) { this.order = order; return this; }
        public Builder taskType(TaskType taskType) { this.taskType = taskType; return this; }
        public Builder taskDescription(String taskDescription) { this.taskDescription = taskDescription; return this; }
        public Builder priority(TaskPriority priority) { this.priority = priority; return this; }
        public Builder assignedDate(LocalDateTime assignedDate) { this.assignedDate = assignedDate; return this; }
        public Builder dueDate(LocalDateTime dueDate) { this.dueDate = dueDate; return this; }
        public Builder taskStatus(TaskStatus taskStatus) { this.taskStatus = taskStatus; return this; }
        public Builder assignedBy(User assignedBy) { this.assignedBy = assignedBy; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public EmployeeTask build() {
            return new EmployeeTask(id, employee, order, taskType, taskDescription, priority, assignedDate, dueDate, taskStatus, assignedBy, createdAt, updatedAt);
        }
    }
}
