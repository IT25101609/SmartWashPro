package com.smartwashpro.model;

// Import the enums used for task type, priority, and status
import com.smartwashpro.model.enums.TaskPriority;
import com.smartwashpro.model.enums.TaskStatus;
import com.smartwashpro.model.enums.TaskType;

import jakarta.persistence.*;
import java.time.LocalDateTime;


// @Entity means this class is connected to a database table
@Entity

// The database table name will be "employee_tasks"
@Table(name = "employee_tasks")
public class EmployeeTask {

    // Primary key of the employee_tasks table
    @Id

    // Automatically generates the ID
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // Many tasks can belong to one employee
    @ManyToOne(fetch = FetchType.LAZY)

    // Creates employee_id as a foreign key
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;


    // Many tasks can be related to one order
    @ManyToOne(fetch = FetchType.LAZY)

    // Creates order_id as a foreign key
    @JoinColumn(name = "order_id")
    private Order order;


    // Stores the type of task
    // Example: WASHING, IRONING, DELIVERY, etc.
    @Enumerated(EnumType.STRING)
    private TaskType taskType;


    // Stores a description of what the employee needs to do
    private String taskDescription;


    // Stores the priority of the task
    // Default priority is MEDIUM
    @Enumerated(EnumType.STRING)
    private TaskPriority priority = TaskPriority.MEDIUM;


    // Date and time when the task was assigned
    private LocalDateTime assignedDate;


    // Deadline of the task
    private LocalDateTime dueDate;


    // Stores the current status of the task
    // Default status is PENDING
    @Enumerated(EnumType.STRING)
    private TaskStatus taskStatus = TaskStatus.PENDING;


    // Stores the user who assigned the task
    // Many tasks can be assigned by one user
    @ManyToOne(fetch = FetchType.LAZY)

    // Creates assigned_by_user_id as a foreign key
    @JoinColumn(name = "assigned_by_user_id")
    private User assignedBy;


    // Date and time when the task was created
    private LocalDateTime createdAt;


    // Date and time when the task was last updated
    private LocalDateTime updatedAt;


    // Default constructor
    // Required by JPA
    public EmployeeTask() {}


    // Constructor used to create an EmployeeTask object
    // with all the required information
    public EmployeeTask(
            Long id,
            Employee employee,
            Order order,
            TaskType taskType,
            String taskDescription,
            TaskPriority priority,
            LocalDateTime assignedDate,
            LocalDateTime dueDate,
            TaskStatus taskStatus,
            User assignedBy,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.employee = employee;
        this.order = order;
        this.taskType = taskType;
        this.taskDescription = taskDescription;


        // If priority is null, use MEDIUM as the default
        this.priority = priority != null
                ? priority
                : TaskPriority.MEDIUM;


        this.assignedDate = assignedDate;
        this.dueDate = dueDate;


        // If task status is null, use PENDING as the default
        this.taskStatus = taskStatus != null
                ? taskStatus
                : TaskStatus.PENDING;


        this.assignedBy = assignedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    // Runs automatically before a new task is saved
    @PrePersist
    protected void onCreate() {

        // Set the date and time when the task is created
        createdAt = LocalDateTime.now();

        // Set the initial update time
        updatedAt = LocalDateTime.now();
    }


    // Runs automatically before an existing task is updated
    @PreUpdate
    protected void onUpdate() {

        // Update the last modified date and time
        updatedAt = LocalDateTime.now();
    }


    // Getter for task ID
    public Long getId() {
        return id;
    }

    // Setter for task ID
    public void setId(Long id) {
        this.id = id;
    }


    // Getter for employee
    public Employee getEmployee() {
        return employee;
    }

    // Setter for employee
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }


    // Getter for order
    public Order getOrder() {
        return order;
    }

    // Setter for order
    public void setOrder(Order order) {
        this.order = order;
    }


    // Getter for task type
    public TaskType getTaskType() {
        return taskType;
    }

    // Setter for task type
    public void setTaskType(TaskType taskType) {
        this.taskType = taskType;
    }


    // Getter for task description
    public String getTaskDescription() {
        return taskDescription;
    }

    // Setter for task description
    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }


    // Getter for task priority
    public TaskPriority getPriority() {
        return priority;
    }

    // Setter for task priority
    public void setPriority(TaskPriority priority) {
        this.priority = priority;
    }


    // Getter for assigned date
    public LocalDateTime getAssignedDate() {
        return assignedDate;
    }

    // Setter for assigned date
    public void setAssignedDate(LocalDateTime assignedDate) {
        this.assignedDate = assignedDate;
    }


    // Getter for due date
    public LocalDateTime getDueDate() {
        return dueDate;
    }

    // Setter for due date
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }


    // Getter for task status
    public TaskStatus getTaskStatus() {
        return taskStatus;
    }

    // Setter for task status
    public void setTaskStatus(TaskStatus taskStatus) {
        this.taskStatus = taskStatus;
    }


    // Getter for the user who assigned the task
    public User getAssignedBy() {
        return assignedBy;
    }

    // Setter for the user who assigned the task
    public void setAssignedBy(User assignedBy) {
        this.assignedBy = assignedBy;
    }


    // Getter for creation date
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Setter for creation date
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


    // Getter for last update date
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Setter for last update date
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }


    // Starts the Builder pattern
    // Used to create an EmployeeTask object step-by-step
    public static Builder builder() {
        return new Builder();
    }


    // Builder class helps create EmployeeTask objects
    // without using a long constructor
    public static class Builder {

        private Long id;
        private Employee employee;
        private Order order;
        private TaskType taskType;
        private String taskDescription;

        // Default priority
        private TaskPriority priority = TaskPriority.MEDIUM;

        private LocalDateTime assignedDate;
        private LocalDateTime dueDate;

        // Default task status
        private TaskStatus taskStatus = TaskStatus.PENDING;

        private User assignedBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;


        // Set task ID
        public Builder id(Long id) {
            this.id = id;
            return this;
        }


        // Set the employee assigned to the task
        public Builder employee(Employee employee) {
            this.employee = employee;
            return this;
        }


        // Set the related order
        public Builder order(Order order) {
            this.order = order;
            return this;
        }


        // Set the type of task
        public Builder taskType(TaskType taskType) {
            this.taskType = taskType;
            return this;
        }


        // Set the task description
        public Builder taskDescription(String taskDescription) {
            this.taskDescription = taskDescription;
            return this;
        }


        // Set the task priority
        public Builder priority(TaskPriority priority) {
            this.priority = priority;
            return this;
        }


        // Set the assigned date
        public Builder assignedDate(LocalDateTime assignedDate) {
            this.assignedDate = assignedDate;
            return this;
        }


        // Set the deadline
        public Builder dueDate(LocalDateTime dueDate) {
            this.dueDate = dueDate;
            return this;
        }


        // Set the task status
        public Builder taskStatus(TaskStatus taskStatus) {
            this.taskStatus = taskStatus;
            return this;
        }


        // Set the user who assigned the task
        public Builder assignedBy(User assignedBy) {
            this.assignedBy = assignedBy;
            return this;
        }


        // Set the creation time
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }


        // Set the last update time
        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }


        // Creates the final EmployeeTask object
        public EmployeeTask build() {

            return new EmployeeTask(
                    id,
                    employee,
                    order,
                    taskType,
                    taskDescription,
                    priority,
                    assignedDate,
                    dueDate,
                    taskStatus,
                    assignedBy,
                    createdAt,
                    updatedAt
            );
        }
    }
}
