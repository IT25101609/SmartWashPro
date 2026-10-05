package com.smartwashpro.service;

// Request and Response DTOs
import com.smartwashpro.dto.request.TaskRequest;
import com.smartwashpro.dto.response.TaskResponse;

// Custom exceptions
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;

// Model classes
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.EmployeeTask;
import com.smartwashpro.model.Order;
import com.smartwashpro.model.User;

// Enum classes
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.TaskPriority;
import com.smartwashpro.model.enums.TaskStatus;
import com.smartwashpro.model.enums.TaskType;

// Repositories
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.repository.EmployeeTaskRepository;
import com.smartwashpro.repository.OrderRepository;

// Security and Spring
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


// @Service means this class contains the business logic for tasks
@Service
public class TaskService {

    // Repositories used to access database data
    private final EmployeeTaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final OrderRepository orderRepository;
    private final BranchRepository branchRepository;

    // Used to check branch access and permissions
    private final SecurityUtils securityUtils;


    // Constructor injection
    // Spring provides these required objects automatically
    public TaskService(EmployeeTaskRepository taskRepository,
                       EmployeeRepository employeeRepository,
                       OrderRepository orderRepository,
                       BranchRepository branchRepository,
                       SecurityUtils securityUtils) {

        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.orderRepository = orderRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }


    // Get tasks with filters such as branch, employee, status,
    // priority and search text
    public Page<TaskResponse> filterTasks(
            Long branchId,
            Long employeeId,
            String statusStr,
            String priorityStr,
            String search,
            User currentUser,
            Pageable pageable) {

        Long effectiveBranchId = branchId;

        // Branch managers can only see tasks from their own branch
        if (currentUser != null &&
                currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {

            effectiveBranchId = currentUser.getBranchId();
        }


        // Convert status string into TaskStatus enum
        TaskStatus status = null;

        if (statusStr != null &&
                !statusStr.isBlank() &&
                !statusStr.equalsIgnoreCase("ALL")) {

            try {
                status = TaskStatus.valueOf(
                        statusStr.trim().toUpperCase());

            } catch (IllegalArgumentException ignored) {
                // Keep status as null if invalid value is provided
            }
        }


        // Convert priority string into TaskPriority enum
        TaskPriority priority = null;

        if (priorityStr != null &&
                !priorityStr.isBlank() &&
                !priorityStr.equalsIgnoreCase("ALL")) {

            try {
                priority = TaskPriority.valueOf(
                        priorityStr.trim().toUpperCase());

            } catch (IllegalArgumentException ignored) {
                // Keep priority as null if invalid value is provided
            }
        }


        // Remove unnecessary spaces from search text
        String searchTrimmed =
                (search != null && !search.trim().isEmpty())
                        ? search.trim()
                        : null;


        // Get filtered tasks from database
        Page<EmployeeTask> tasks =
                taskRepository.filterTasks(
                        effectiveBranchId,
                        employeeId,
                        status,
                        priority,
                        searchTrimmed,
                        pageable);

        // Convert EmployeeTask objects into TaskResponse objects
        return tasks.map(this::mapToResponse);
    }


    // Get a single task by ID
    public TaskResponse getTaskById(
            Long id,
            User currentUser) {

        // Find task or throw exception if it does not exist
        EmployeeTask task =
                taskRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Task", id));


        // Branch managers can only access tasks
        // belonging to their own branch
        if (currentUser != null &&
                currentUser.getRole() ==
                        Role.BRANCH_MANAGER_ADMIN) {

            if (task.getEmployee() != null) {

                securityUtils.validateBranchAccess(
                        task.getEmployee().getBranchId());
            }
        }

        return mapToResponse(task);
    }


    // Create a new task
    @Transactional
    public TaskResponse createTask(
            TaskRequest request,
            User currentUser) {

        // An employee must be selected
        if (request.getEmployeeId() == null) {

            throw new BusinessRuleException(
                    "Please select an employee for the task");
        }


        // Find the employee who will receive the task
        Employee employee =
                employeeRepository.findById(
                        request.getEmployeeId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Employee",
                                        request.getEmployeeId()));


        // Branch manager can only assign tasks
        // inside their own branch
        if (currentUser != null &&
                currentUser.getRole() ==
                        Role.BRANCH_MANAGER_ADMIN) {

            securityUtils.validateBranchAccess(
                    employee.getBranchId());
        }


        // Tasks cannot be assigned to inactive employees
        if (employee.getEmploymentStatus() !=
                EmploymentStatus.ACTIVE) {

            String empName =
                    employee.getUser() != null
                            ? employee.getUser().getFullName()
                            : "Employee #" + employee.getId();

            throw new BusinessRuleException(
                    "Cannot assign tasks to an inactive employee: "
                            + empName);
        }


        // Task description/title must be provided
        String combinedDesc =
                request.getCombinedDescription();

        if (combinedDesc == null ||
                combinedDesc.trim().isBlank()) {

            throw new BusinessRuleException(
                    "Task title or description is required");
        }


        // Order is optional
        Order order = null;

        if (request.getOrderId() != null) {

            // Find the related order
            order = orderRepository.findById(
                            request.getOrderId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Order",
                                    request.getOrderId()));
        }


        // Create the EmployeeTask object
        EmployeeTask task = EmployeeTask.builder()
                .employee(employee)
                .order(order)

                // If no type is selected, use OTHER
                .taskType(
                        request.getTaskType() != null
                                ? request.getTaskType()
                                : TaskType.OTHER)

                .taskDescription(combinedDesc)

                // Default priority is MEDIUM
                .priority(
                        request.getPriority() != null
                                ? request.getPriority()
                                : TaskPriority.MEDIUM)

                .dueDate(request.getDueDate())

                // New tasks start as PENDING
                .taskStatus(TaskStatus.PENDING)

                // Store the current date and time
                .assignedDate(LocalDateTime.now())

                // Store who assigned the task
                .assignedBy(currentUser)

                .build();


        // Save task and return response
        return mapToResponse(
                taskRepository.save(task));
    }


    // Update an existing task
    @Transactional
    public TaskResponse updateTask(
            Long id,
            TaskRequest request,
            User currentUser) {

        // Find the task
        EmployeeTask task =
                taskRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Task", id));


        // Check branch access for Branch Manager
        if (currentUser != null &&
                currentUser.getRole() ==
                        Role.BRANCH_MANAGER_ADMIN) {

            if (task.getEmployee() != null) {

                securityUtils.validateBranchAccess(
                        task.getEmployee().getBranchId());
            }
        }


        // Completed tasks cannot be edited
        if (task.getTaskStatus() ==
                TaskStatus.COMPLETED) {

            throw new BusinessRuleException(
                    "Cannot edit task: Task #" +
                            id +
                            " is already COMPLETED");
        }


        // Cancelled tasks cannot be edited
        if (task.getTaskStatus() ==
                TaskStatus.CANCELLED) {

            throw new BusinessRuleException(
                    "Cannot edit task: Task #" +
                            id +
                            " is CANCELLED");
        }


        // Change assigned employee if a new employee is provided
        if (request.getEmployeeId() != null &&
                !request.getEmployeeId().equals(
                        task.getEmployee().getId())) {

            Employee newEmployee =
                    employeeRepository.findById(
                            request.getEmployeeId())
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Employee",
                                            request.getEmployeeId()));


            // New employee must be active
            if (newEmployee.getEmploymentStatus() !=
                    EmploymentStatus.ACTIVE) {

                String empName =
                        newEmployee.getUser() != null
                                ? newEmployee.getUser().getFullName()
                                : "Employee #" +
                                  newEmployee.getId();

                throw new BusinessRuleException(
                        "Cannot reassign task to an inactive employee: "
                                + empName);
            }

            task.setEmployee(newEmployee);
        }


        // Update title/description
        if (request.getTitle() != null ||
                request.getDescription() != null) {

            task.setTaskDescription(
                    request.getCombinedDescription());
        }


        // Update priority
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }


        // Update task type
        if (request.getTaskType() != null) {
            task.setTaskType(request.getTaskType());
        }


        // Update due date
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }


        // Update related order
        if (request.getOrderId() != null) {

            Order order =
                    orderRepository.findById(
                            request.getOrderId())
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Order",
                                            request.getOrderId()));

            task.setOrder(order);
        }


        // Save updated task
        return mapToResponse(
                taskRepository.save(task));
    }


    // Change the status of a task
    @Transactional
    public TaskResponse updateStatus(
            Long id,
            String newStatusStr,
            User currentUser) {

        // Find task
        EmployeeTask task =
                taskRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Task", id));


        // Check branch access
        if (currentUser != null &&
                currentUser.getRole() ==
                        Role.BRANCH_MANAGER_ADMIN) {

            if (task.getEmployee() != null) {

                securityUtils.validateBranchAccess(
                        task.getEmployee().getBranchId());
            }
        }


        // Get current task status
        TaskStatus current =
                task.getTaskStatus();

        TaskStatus target;


        // Convert new status from String to enum
        try {

            target = TaskStatus.valueOf(
                    newStatusStr.trim().toUpperCase());

        } catch (Exception e) {

            throw new BusinessRuleException(
                    "Invalid task status: " +
                            newStatusStr);
        }


        // If status is already the same,
        // no update is needed
        if (current == target) {
            return mapToResponse(task);
        }


        // Completed task cannot change status
        if (current == TaskStatus.COMPLETED) {

            throw new BusinessRuleException(
                    "Cannot change status: Task #" +
                            id +
                            " is already COMPLETED");
        }


        // Cancelled task cannot change status
        if (current == TaskStatus.CANCELLED) {

            throw new BusinessRuleException(
                    "Cannot change status: Task #" +
                            id +
                            " is CANCELLED");
        }


        // Task status workflow:
        //
        // PENDING → IN_PROGRESS → COMPLETED
        //                  ↓
        //               CANCELLED
        //
        if (current == TaskStatus.PENDING) {

            // From PENDING, task can go to:
            // IN_PROGRESS, COMPLETED or CANCELLED
            if (target != TaskStatus.IN_PROGRESS &&
                    target != TaskStatus.COMPLETED &&
                    target != TaskStatus.CANCELLED) {

                throw new BusinessRuleException(
                        "Invalid status transition from PENDING to "
                                + target);
            }

        } else if (current ==
                TaskStatus.IN_PROGRESS) {

            // From IN_PROGRESS, task can go to:
            // COMPLETED or CANCELLED
            if (target != TaskStatus.COMPLETED &&
                    target != TaskStatus.CANCELLED) {

                throw new BusinessRuleException(
                        "Invalid status transition from IN_PROGRESS to "
                                + target);
            }
        }


        // Update the status
        task.setTaskStatus(target);

        // Save and return updated task
        return mapToResponse(
                taskRepository.save(task));
    }


    // Shortcut method to mark a task as completed
    @Transactional
    public TaskResponse markAsCompleted(
            Long id,
            User currentUser) {

        return updateStatus(
                id,
                "COMPLETED",
                currentUser);
    }


    // Shortcut method to cancel a task
    @Transactional
    public TaskResponse cancelTask(
            Long id,
            User currentUser) {

        return updateStatus(
                id,
                "CANCELLED",
                currentUser);
    }


    // Delete a task
    @Transactional
    public void deleteTask(
            Long id,
            User currentUser) {

        // Find task
        EmployeeTask task =
                taskRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Task", id));


        // Check branch access
        if (currentUser != null &&
                currentUser.getRole() ==
                        Role.BRANCH_MANAGER_ADMIN) {

            if (task.getEmployee() != null) {

                securityUtils.validateBranchAccess(
                        task.getEmployee().getBranchId());
            }
        }


        // Delete task from database
        taskRepository.delete(task);
    }


    // Convert EmployeeTask entity into TaskResponse DTO
    public TaskResponse mapToResponse(
            EmployeeTask task) {

        String fullDesc =
                task.getTaskDescription();

        String title = null;
        String desc = fullDesc;


        // Separate title and description
        if (fullDesc != null &&
                !fullDesc.isBlank()) {

            // Format: title + blank line + description
            if (fullDesc.contains("\n\n")) {

                int idx =
                        fullDesc.indexOf("\n\n");

                title =
                        fullDesc.substring(
                                0, idx).trim();

                desc =
                        fullDesc.substring(
                                idx + 2).trim();


            // Format: title - description
            } else if (fullDesc.contains(" - ")) {

                int idx =
                        fullDesc.indexOf(" - ");

                title =
                        fullDesc.substring(
                                0, idx).trim();

                desc =
                        fullDesc.substring(
                                idx + 3).trim();


            // If there is no separator,
            // use the full text as both title and description
            } else {

                title = fullDesc;
                desc = fullDesc;
            }
        }


        // Get employee information
        Employee emp =
                task.getEmployee();

        User u =
                emp != null
                        ? emp.getUser()
                        : null;


        // Get employee name
        String empName =
                u != null
                        ? u.getFullName()
                        : (emp != null
                                ? "Employee #" + emp.getId()
                                : "Unassigned");


        // Get employee phone number
        String empPhone =
                u != null
                        ? u.getPhoneNumber()
                        : null;


        // Get employee role
        String empRole =
                emp != null
                        ? emp.getRole()
                        : null;


        // Get branch ID
        Long branchId =
                emp != null
                        ? emp.getBranchId()
                        : null;


        // Get branch name
        String branchName = null;

        if (branchId != null) {

            Branch b =
                    branchRepository.findById(branchId)
                            .orElse(null);

            if (b != null) {
                branchName = b.getBranchName();
            }
        }


        // Build the response object
        return TaskResponse.builder()

                .id(task.getId())

                .employeeId(
                        emp != null
                                ? emp.getId()
                                : null)

                .employeeName(empName)

                .employeeRole(empRole)

                .employeePhone(empPhone)

                .branchId(branchId)

                .branchName(branchName)

                .orderId(
                        task.getOrder() != null
                                ? task.getOrder().getId()
                                : null)

                .taskType(
                        task.getTaskType() != null
                                ? task.getTaskType().name()
                                : "OTHER")

                .taskTitle(
                        title != null
                                ? title
                                : "Task #" +
                                  task.getId())

                .taskDescription(desc)

                .priority(
                        task.getPriority() != null
                                ? task.getPriority().name()
                                : "MEDIUM")

                .taskStatus(
                        task.getTaskStatus() != null
                                ? task.getTaskStatus().name()
                                : "PENDING")

                .assignedByName(
                        task.getAssignedBy() != null
                                ? task.getAssignedBy().getFullName()
                                : null)

                .assignedDate(
                        task.getAssignedDate() != null
                                ? task.getAssignedDate()
                                : task.getCreatedAt())

                .dueDate(task.getDueDate())

                .createdAt(task.getCreatedAt())

                .updatedAt(task.getUpdatedAt())

                .build();
    }
}
