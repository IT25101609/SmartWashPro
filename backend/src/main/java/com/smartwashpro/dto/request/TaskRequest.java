package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.TaskPriority;
import com.smartwashpro.model.enums.TaskType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class TaskRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private Long orderId;
    private String title;
    private String taskTitle;
    private String description;
    private String taskDescription;
    private TaskType taskType;
    private TaskPriority priority;
    private LocalDateTime dueDate;

    public TaskRequest() {}

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getTitle() { return title != null ? title : taskTitle; }
    public void setTitle(String title) { this.title = title; }

    public String getTaskTitle() { return taskTitle != null ? taskTitle : title; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }

    public String getDescription() { return description != null ? description : taskDescription; }
    public void setDescription(String description) { this.description = description; }

    public String getTaskDescription() { return taskDescription != null ? taskDescription : description; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }

    public TaskType getTaskType() { return taskType != null ? taskType : TaskType.OTHER; }
    public void setTaskType(TaskType taskType) { this.taskType = taskType; }

    public TaskPriority getPriority() { return priority != null ? priority : TaskPriority.MEDIUM; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    /**
     * Resolves the combined stored description from title and description fields.
     */
    public String getCombinedDescription() {
        String t = getTitle();
        String d = getDescription();
        if (t != null && !t.isBlank() && d != null && !d.isBlank()) {
            if (d.startsWith(t)) return d;
            return t.trim() + "\n\n" + d.trim();
        }
        if (t != null && !t.isBlank()) return t.trim();
        if (d != null && !d.isBlank()) return d.trim();
        return "Operational Task";
    }
}
