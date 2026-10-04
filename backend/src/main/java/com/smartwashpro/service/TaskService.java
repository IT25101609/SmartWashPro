package com.smartwashpro.service;

import com.smartwashpro.dto.request.TaskRequest;
import com.smartwashpro.dto.response.TaskResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.EmployeeTask;
import com.smartwashpro.model.Order;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.TaskPriority;
import com.smartwashpro.model.enums.TaskStatus;
import com.smartwashpro.model.enums.TaskType;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.repository.EmployeeTaskRepository;
import com.smartwashpro.repository.OrderRepository;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class TaskService {

    private final EmployeeTaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final OrderRepository orderRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

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

    public Page<TaskResponse> filterTasks(Long branchId, Long employeeId, String statusStr,
                                         String priorityStr, String search, User currentUser, Pageable pageable) {
        Long effectiveBranchId = branchId;
        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            effectiveBranchId = currentUser.getBranchId();
        }

        TaskStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !statusStr.equalsIgnoreCase("ALL")) {
            try {
                status = TaskStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        TaskPriority priority = null;
        if (priorityStr != null && !priorityStr.isBlank() && !priorityStr.equalsIgnoreCase("ALL")) {
            try {
                priority = TaskPriority.valueOf(priorityStr.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<EmployeeTask> tasks = taskRepository.filterTasks(effectiveBranchId, employeeId, status, priority, searchTrimmed, pageable);
        return tasks.map(this::mapToResponse);
    }

    public TaskResponse getTaskById(Long id, User currentUser) {
        EmployeeTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (task.getEmployee() != null) {
                securityUtils.validateBranchAccess(task.getEmployee().getBranchId());
            }
        }
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request, User currentUser) {
        if (request.getEmployeeId() == null) {
            throw new BusinessRuleException("Please select an employee for the task");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getEmployeeId()));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            securityUtils.validateBranchAccess(employee.getBranchId());
        }

        if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
            String empName = employee.getUser() != null ? employee.getUser().getFullName() : "Employee #" + employee.getId();
            throw new BusinessRuleException("Cannot assign tasks to an inactive employee: " + empName);
        }

        String combinedDesc = request.getCombinedDescription();
        if (combinedDesc == null || combinedDesc.trim().isBlank()) {
            throw new BusinessRuleException("Task title or description is required");
        }

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));
        }

        EmployeeTask task = EmployeeTask.builder()
                .employee(employee)
                .order(order)
                .taskType(request.getTaskType() != null ? request.getTaskType() : TaskType.OTHER)
                .taskDescription(combinedDesc)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .taskStatus(TaskStatus.PENDING)
                .assignedDate(LocalDateTime.now())
                .assignedBy(currentUser)
                .build();

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request, User currentUser) {
        EmployeeTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (task.getEmployee() != null) {
                securityUtils.validateBranchAccess(task.getEmployee().getBranchId());
            }
        }

        if (task.getTaskStatus() == TaskStatus.COMPLETED) {
            throw new BusinessRuleException("Cannot edit task: Task #" + id + " is already COMPLETED");
        }
        if (task.getTaskStatus() == TaskStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot edit task: Task #" + id + " is CANCELLED");
        }

        if (request.getEmployeeId() != null && !request.getEmployeeId().equals(task.getEmployee().getId())) {
            Employee newEmployee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getEmployeeId()));
            if (newEmployee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                String empName = newEmployee.getUser() != null ? newEmployee.getUser().getFullName() : "Employee #" + newEmployee.getId();
                throw new BusinessRuleException("Cannot reassign task to an inactive employee: " + empName);
            }
            task.setEmployee(newEmployee);
        }

        if (request.getTitle() != null || request.getDescription() != null) {
            task.setTaskDescription(request.getCombinedDescription());
        }

        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }

        if (request.getTaskType() != null) {
            task.setTaskType(request.getTaskType());
        }

        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }

        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));
            task.setOrder(order);
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long id, String newStatusStr, User currentUser) {
        EmployeeTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (task.getEmployee() != null) {
                securityUtils.validateBranchAccess(task.getEmployee().getBranchId());
            }
        }

        TaskStatus current = task.getTaskStatus();
        TaskStatus target;
        try {
            target = TaskStatus.valueOf(newStatusStr.trim().toUpperCase());
        } catch (Exception e) {
            throw new BusinessRuleException("Invalid task status: " + newStatusStr);
        }

        if (current == target) {
            return mapToResponse(task);
        }

        if (current == TaskStatus.COMPLETED) {
            throw new BusinessRuleException("Cannot change status: Task #" + id + " is already COMPLETED");
        }
        if (current == TaskStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot change status: Task #" + id + " is CANCELLED");
        }

        // Proper workflow: PENDING -> IN_PROGRESS -> COMPLETED (or CANCELLED)
        if (current == TaskStatus.PENDING) {
            if (target != TaskStatus.IN_PROGRESS && target != TaskStatus.COMPLETED && target != TaskStatus.CANCELLED) {
                throw new BusinessRuleException("Invalid status transition from PENDING to " + target);
            }
        } else if (current == TaskStatus.IN_PROGRESS) {
            if (target != TaskStatus.COMPLETED && target != TaskStatus.CANCELLED) {
                throw new BusinessRuleException("Invalid status transition from IN_PROGRESS to " + target);
            }
        }

        task.setTaskStatus(target);
        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse markAsCompleted(Long id, User currentUser) {
        return updateStatus(id, "COMPLETED", currentUser);
    }

    @Transactional
    public TaskResponse cancelTask(Long id, User currentUser) {
        return updateStatus(id, "CANCELLED", currentUser);
    }

    @Transactional
    public void deleteTask(Long id, User currentUser) {
        EmployeeTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (task.getEmployee() != null) {
                securityUtils.validateBranchAccess(task.getEmployee().getBranchId());
            }
        }
        taskRepository.delete(task);
    }

    public TaskResponse mapToResponse(EmployeeTask task) {
        String fullDesc = task.getTaskDescription();
        String title = null;
        String desc = fullDesc;

        if (fullDesc != null && !fullDesc.isBlank()) {
            if (fullDesc.contains("\n\n")) {
                int idx = fullDesc.indexOf("\n\n");
                title = fullDesc.substring(0, idx).trim();
                desc = fullDesc.substring(idx + 2).trim();
            } else if (fullDesc.contains(" - ")) {
                int idx = fullDesc.indexOf(" - ");
                title = fullDesc.substring(0, idx).trim();
                desc = fullDesc.substring(idx + 3).trim();
            } else {
                title = fullDesc;
                desc = fullDesc;
            }
        }

        Employee emp = task.getEmployee();
        User u = emp != null ? emp.getUser() : null;
        String empName = u != null ? u.getFullName() : (emp != null ? "Employee #" + emp.getId() : "Unassigned");
        String empPhone = u != null ? u.getPhoneNumber() : null;
        String empRole = emp != null ? emp.getRole() : null;
        Long branchId = emp != null ? emp.getBranchId() : null;
        String branchName = null;
        if (branchId != null) {
            Branch b = branchRepository.findById(branchId).orElse(null);
            if (b != null) branchName = b.getBranchName();
        }

        return TaskResponse.builder()
                .id(task.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(empName)
                .employeeRole(empRole)
                .employeePhone(empPhone)
                .branchId(branchId)
                .branchName(branchName)
                .orderId(task.getOrder() != null ? task.getOrder().getId() : null)
                .taskType(task.getTaskType() != null ? task.getTaskType().name() : "OTHER")
                .taskTitle(title != null ? title : "Task #" + task.getId())
                .taskDescription(desc)
                .priority(task.getPriority() != null ? task.getPriority().name() : "MEDIUM")
                .taskStatus(task.getTaskStatus() != null ? task.getTaskStatus().name() : "PENDING")
                .assignedByName(task.getAssignedBy() != null ? task.getAssignedBy().getFullName() : null)
                .assignedDate(task.getAssignedDate() != null ? task.getAssignedDate() : task.getCreatedAt())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
