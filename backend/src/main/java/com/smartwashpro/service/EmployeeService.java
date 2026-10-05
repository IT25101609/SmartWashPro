package com.smartwashpro.service;

// Request and Response DTOs
import com.smartwashpro.dto.request.EmployeeRequest;
import com.smartwashpro.dto.response.AttendanceResponse;
import com.smartwashpro.dto.response.EmployeeResponse;
import com.smartwashpro.dto.response.TaskResponse;

// Custom exceptions
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.DuplicateResourceException;
import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.exception.ResourceNotFoundException;

// Model classes
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.EmployeeTask;
import com.smartwashpro.model.User;

// Enum classes
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.TaskStatus;
import com.smartwashpro.model.enums.UserStatus;

// Repositories for database operations
import com.smartwashpro.repository.AttendanceRepository;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.repository.EmployeeTaskRepository;
import com.smartwashpro.repository.UserRepository;

// Security and Spring imports
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;


// @Service means this class contains business logic
@Service
public class EmployeeService {

    // List of employee roles allowed in the system
    private static final List<String> VALID_ROLES = Arrays.asList(
            "MANAGER", "BRANCH_MANAGER",
            "RECEPTIONIST",
            "LAUNDRY_STAFF",
            "DRIVER", "DELIVERY_DRIVER",
            "MAINTENANCE_STAFF",
            "FINANCE_LEAD"
    );

    // Pattern used to validate phone numbers
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^[+0-9\\s\\-\\(\\)]{7,25}$");

    // Repositories used to communicate with the database
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final EmployeeTaskRepository employeeTaskRepository;
    private final AttendanceRepository attendanceRepository;

    // Used to encrypt passwords before saving them
    private final PasswordEncoder passwordEncoder;

    // Used to check user permissions and branch access
    private final SecurityUtils securityUtils;


    // Constructor injection
    // Spring automatically provides these required objects
    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           BranchRepository branchRepository,
                           EmployeeTaskRepository employeeTaskRepository,
                           AttendanceRepository attendanceRepository,
                           PasswordEncoder passwordEncoder,
                           SecurityUtils securityUtils) {

        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.employeeTaskRepository = employeeTaskRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityUtils = securityUtils;
    }


    // Get all employees with optional filters and pagination
    public Page<EmployeeResponse> getAllEmployees(
            String search,
            Long branchId,
            String role,
            EmploymentStatus status,
            Pageable pageable) {

        // Admin can view any branch.
        // Other users can only view their own branch.
        Long effectiveBranchId = branchId;

        if (!securityUtils.isAdmin()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        // Clean the search value
        String searchTrimmed =
                (search != null && !search.trim().isEmpty())
                        ? search.trim()
                        : null;

        // Clean and standardize the role
        String roleTrimmed =
                (role != null &&
                 !role.trim().isEmpty() &&
                 !role.equalsIgnoreCase("ALL"))
                        ? role.trim().toUpperCase()
                        : null;

        // Get employees from database using filters
        Page<Employee> page = employeeRepository.filterEmployees(
                effectiveBranchId,
                status,
                roleTrimmed,
                searchTrimmed,
                pageable
        );

        // Convert Employee objects into EmployeeResponse objects
        return page.map(this::mapToResponse);
    }


    // Get one employee by ID
    public EmployeeResponse getEmployeeById(Long id) {

        // Find employee or throw an error if not found
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        // Check whether current user is allowed to access this branch
        securityUtils.validateBranchAccess(employee.getBranchId());

        return mapToResponse(employee);
    }


    // Create a new employee
    // @Transactional means all database operations are treated as one transaction
    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {

        // Validate employee input
        validateEmployeeRequest(request, true);

        // Check whether email is already registered
        if (userRepository.existsByEmail(
                request.getEmail().trim().toLowerCase())) {

            throw new DuplicateResourceException(
                    "User email already registered: " + request.getEmail());
        }

        Long targetBranchId;

        // System Admin can select any branch
        if (securityUtils.isAdmin()) {

            targetBranchId = request.getBranchId();

            // Check whether selected branch exists
            if (targetBranchId != null &&
                    !branchRepository.existsById(targetBranchId)) {

                throw new ResourceNotFoundException(
                        "Branch", targetBranchId);
            }

        } else {
            // Non-admin users are assigned to their current branch
            targetBranchId = securityUtils.getCurrentUserBranchId();
        }


        // Convert role into standard format
        String normalizedRole = normalizeRole(request.getRole());

        // Managers receive manager security permissions
        // Other employees receive normal user permissions
        Role userSecurityRole =
                isManagerRole(normalizedRole)
                        ? Role.BRANCH_MANAGER_ADMIN
                        : Role.CUSTOMER;


        // Use entered password or default password
        String rawPassword =
                (request.getPassword() != null &&
                 !request.getPassword().isBlank())
                        ? request.getPassword().trim()
                        : "password123";


        // Create User account
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phoneNumber(
                        request.getPhoneNumber() != null
                                ? request.getPhoneNumber().trim()
                                : null)
                .address(
                        request.getAddress() != null
                                ? request.getAddress().trim()
                                : null)

                // Encrypt password before saving
                .passwordHash(passwordEncoder.encode(rawPassword))

                .role(userSecurityRole)
                .status(UserStatus.ACTIVE)
                .branchId(targetBranchId)
                .build();

        // Save User to database
        user = userRepository.save(user);


        // Default employment status is ACTIVE
        EmploymentStatus status = EmploymentStatus.ACTIVE;

        // If a status was provided, convert it to the enum
        if (request.getEmploymentStatus() != null &&
                !request.getEmploymentStatus().isBlank()) {

            try {
                status = EmploymentStatus.valueOf(
                        request.getEmploymentStatus()
                                .trim()
                                .toUpperCase());

            } catch (IllegalArgumentException ignored) {
                // Keep ACTIVE if invalid status is provided
            }
        }


        // Create Employee record
        Employee employee = Employee.builder()
                .user(user)
                .role(normalizedRole)
                .employmentStatus(status)
                .branchId(targetBranchId)

                // Use given hire date or today's date
                .hireDate(
                        request.getHireDate() != null
                                ? request.getHireDate()
                                : LocalDate.now())
                .build();

        // Save employee to database
        Employee saved = employeeRepository.save(employee);

        // Return employee as response DTO
        return mapToResponse(saved);
    }


    // Update an existing employee
    @Transactional
    public EmployeeResponse updateEmployee(
            Long id,
            EmployeeRequest request) {

        // Find employee
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        // Check branch access
        securityUtils.validateBranchAccess(employee.getBranchId());

        // Get related User object
        User user = employee.getUser();


        // Update full name if provided
        if (request.getFullName() != null &&
                !request.getFullName().isBlank()) {

            user.setFullName(request.getFullName().trim());
        }


        // Update phone number
        if (request.getPhoneNumber() != null) {

            // Validate phone number format
            if (!request.getPhoneNumber().isBlank() &&
                    !PHONE_PATTERN.matcher(
                            request.getPhoneNumber().trim()).matches()) {

                throw new BusinessRuleException(
                        "Phone number must be at least 7 digits and contain valid phone characters");
            }

            user.setPhoneNumber(
                    request.getPhoneNumber().trim());
        }


        // Update address
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }


        // Update employee role
        if (request.getRole() != null &&
                !request.getRole().isBlank()) {

            String normalizedRole =
                    normalizeRole(request.getRole());

            employee.setRole(normalizedRole);

            // Manager role gets manager security role
            if (isManagerRole(normalizedRole)) {
                user.setRole(Role.BRANCH_MANAGER_ADMIN);

            // If employee is no longer a manager,
            // change security role back
            } else if (user.getRole() ==
                    Role.BRANCH_MANAGER_ADMIN) {

                user.setRole(Role.CUSTOMER);
            }
        }


        // Update hire date
        if (request.getHireDate() != null) {
            employee.setHireDate(request.getHireDate());
        }


        // Update branch if a branch was provided
        if (request.getBranchId() != null) {
            assignBranchInternal(
                    employee,
                    user,
                    request.getBranchId());
        }


        // Update employment status
        if (request.getEmploymentStatus() != null &&
                !request.getEmploymentStatus().isBlank()) {

            try {
                EmploymentStatus status =
                        EmploymentStatus.valueOf(
                                request.getEmploymentStatus()
                                        .trim()
                                        .toUpperCase());

                employee.setEmploymentStatus(status);

                // Active employee -> active user account
                if (status == EmploymentStatus.ACTIVE) {
                    user.setStatus(UserStatus.ACTIVE);

                // Inactive employee -> blocked user account
                } else if (status == EmploymentStatus.INACTIVE) {
                    user.setStatus(UserStatus.BLOCKED);
                }

            } catch (IllegalArgumentException e) {

                throw new BusinessRuleException(
                        "Invalid employment status: " +
                                request.getEmploymentStatus());
            }
        }


        // Save updated User and Employee
        userRepository.save(user);
        Employee updated = employeeRepository.save(employee);

        return mapToResponse(updated);
    }


    // Assign an employee to a branch
    @Transactional
    public EmployeeResponse assignBranch(Long id, Long branchId) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        // Check whether user has access to current branch
        securityUtils.validateBranchAccess(
                employee.getBranchId());

        // Perform branch assignment
        assignBranchInternal(
                employee,
                employee.getUser(),
                branchId);

        // Save changes
        userRepository.save(employee.getUser());

        return mapToResponse(
                employeeRepository.save(employee));
    }


    // Internal method used for branch assignment
    private void assignBranchInternal(
            Employee employee,
            User user,
            Long branchId) {

        // Non-admin users cannot move employees
        // to another branch
        if (!securityUtils.isAdmin()) {

            Long currentBranchId =
                    securityUtils.getCurrentUserBranchId();

            if (branchId != null &&
                    !branchId.equals(currentBranchId)) {

                throw new ForbiddenException(
                        "Only System Administrators can reassign employees to a different branch");
            }
        }


        // Check whether branch exists
        if (branchId != null &&
                !branchRepository.existsById(branchId)) {

            throw new ResourceNotFoundException(
                    "Branch", branchId);
        }


        // Update branch in Employee
        employee.setBranchId(branchId);

        // Also update branch in User
        if (user != null) {
            user.setBranchId(branchId);
        }
    }


    // Activate an employee
    @Transactional
    public EmployeeResponse activateEmployee(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        securityUtils.validateBranchAccess(
                employee.getBranchId());

        // Set employee as active
        employee.setEmploymentStatus(
                EmploymentStatus.ACTIVE);

        // Activate the related user account
        if (employee.getUser() != null) {

            employee.getUser().setStatus(
                    UserStatus.ACTIVE);

            userRepository.save(employee.getUser());
        }

        return mapToResponse(
                employeeRepository.save(employee));
    }


    // Deactivate an employee
    @Transactional
    public EmployeeResponse deactivateEmployee(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        securityUtils.validateBranchAccess(
                employee.getBranchId());


        // Check whether employee is a Branch Manager
        boolean isTargetBranchManager =
                isManagerRole(employee.getRole()) ||
                (employee.getUser() != null &&
                 employee.getUser().getRole() ==
                         Role.BRANCH_MANAGER_ADMIN);


        // Branch Managers cannot deactivate another Branch Manager
        if (isTargetBranchManager &&
                !securityUtils.isAdmin()) {

            throw new ForbiddenException(
                    "A Branch Manager cannot deactivate another Branch Manager. Only System Admin can perform this action.");
        }


        // Mark employee as inactive
        employee.setEmploymentStatus(
                EmploymentStatus.INACTIVE);


        // Block the related user account
        if (employee.getUser() != null) {

            employee.getUser().setStatus(
                    UserStatus.BLOCKED);

            userRepository.save(employee.getUser());
        }

        return mapToResponse(
                employeeRepository.save(employee));
    }


    // Switch between ACTIVE and INACTIVE
    @Transactional
    public EmployeeResponse toggleStatus(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        securityUtils.validateBranchAccess(
                employee.getBranchId());

        // If active, deactivate
        if (employee.getEmploymentStatus() ==
                EmploymentStatus.ACTIVE) {

            return deactivateEmployee(id);

        } else {
            // If inactive, activate
            return activateEmployee(id);
        }
    }


    // Get all tasks assigned to an employee
    public Page<TaskResponse> getEmployeeTasks(
            Long id,
            Pageable pageable) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        securityUtils.validateBranchAccess(
                employee.getBranchId());

        // Get employee tasks with pagination
        return employeeTaskRepository
                .findByEmployeeId(id, pageable)
                .map(this::mapTaskToResponse);
    }


    // Get attendance records of an employee
    public Page<AttendanceResponse> getEmployeeAttendance(
            Long id,
            Pageable pageable) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee", id));

        securityUtils.validateBranchAccess(
                employee.getBranchId());

        // Get attendance records and convert them to responses
        return attendanceRepository
                .filterAttendance(
                        null,
                        id,
                        null,
                        null,
                        pageable)
                .map(a -> AttendanceResponse.builder()
                        .id(a.getId())
                        .employeeId(a.getEmployee().getId())

                        .employeeName(
                                a.getEmployee().getUser() != null
                                        ? a.getEmployee().getUser().getFullName()
                                        : "Employee #" +
                                          a.getEmployee().getId())

                        .employeeRole(
                                a.getEmployee().getRole())

                        .branchId(
                                a.getEmployee().getBranchId())

                        .date(a.getDate())
                        .checkIn(a.getCheckIn())
                        .checkOut(a.getCheckOut())

                        .attendanceStatus(
                                a.getAttendanceStatus().name())

                        .build());
    }


    // Convert Employee entity into EmployeeResponse DTO
    public EmployeeResponse mapToResponse(Employee employee) {

        User user = employee.getUser();

        String branchName = null;
        String branchCode = null;


        // Get branch name and branch code
        if (employee.getBranchId() != null) {

            Branch b = branchRepository
                    .findById(employee.getBranchId())
                    .orElse(null);

            if (b != null) {
                branchName = b.getBranchName();
                branchCode = b.getBranchCode();
            }
        }


        // Count employee's assigned tasks
        long assignedTasks =
                employeeTaskRepository
                        .countByEmployeeId(employee.getId());

        // Count completed tasks
        long completedTasks =
                employeeTaskRepository
                        .countByEmployeeIdAndTaskStatus(
                                employee.getId(),
                                TaskStatus.COMPLETED);

        // Count attendance records
        long attendanceCount =
                attendanceRepository
                        .countByEmployeeId(employee.getId());


        // Build response object
        return EmployeeResponse.builder()
                .id(employee.getId())
                .userId(user != null ? user.getId() : null)

                .fullName(
                        user != null
                                ? user.getFullName()
                                : "")

                .email(
                        user != null
                                ? user.getEmail()
                                : "")

                .phoneNumber(
                        user != null
                                ? user.getPhoneNumber()
                                : "")

                .address(
                        user != null
                                ? user.getAddress()
                                : "")

                .role(
                        employee.getRole() != null
                                ? employee.getRole()
                                : "")

                .employmentStatus(
                        employee.getEmploymentStatus() != null
                                ? employee.getEmploymentStatus().name()
                                : "ACTIVE")

                .branchId(employee.getBranchId())
                .branchName(branchName)
                .branchCode(branchCode)

                .hireDate(employee.getHireDate())
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())

                .assignedTasksCount(assignedTasks)
                .completedTasksCount(completedTasks)
                .attendanceCount(attendanceCount)

                .build();
    }


    // Convert EmployeeTask entity into TaskResponse DTO
    private TaskResponse mapTaskToResponse(EmployeeTask t) {

        return TaskResponse.builder()
                .id(t.getId())

                .employeeId(
                        t.getEmployee().getId())

                .employeeName(
                        t.getEmployee().getUser() != null
                                ? t.getEmployee().getUser().getFullName()
                                : "")

                .orderId(
                        t.getOrder() != null
                                ? t.getOrder().getId()
                                : null)

                .taskType(
                        t.getTaskType() != null
                                ? t.getTaskType().name()
                                : null)

                .taskDescription(
                        t.getTaskDescription())

                .priority(
                        t.getPriority() != null
                                ? t.getPriority().name()
                                : "MEDIUM")

                .assignedDate(t.getAssignedDate())
                .dueDate(t.getDueDate())

                .taskStatus(
                        t.getTaskStatus() != null
                                ? t.getTaskStatus().name()
                                : "PENDING")

                .assignedByName(
                        t.getAssignedBy() != null
                                ? t.getAssignedBy().getFullName()
                                : null)

                .build();
    }


    // Validate employee details before creating/updating
    private void validateEmployeeRequest(
            EmployeeRequest request,
            boolean isCreate) {

        // Full name is required
        if (request.getFullName() == null ||
                request.getFullName().trim().length() < 2) {

            throw new BusinessRuleException(
                    "Full name is required and must be at least 2 characters");
        }


        // Email is required when creating an employee
        if (isCreate) {

            if (request.getEmail() == null ||
                    !request.getEmail().contains("@")) {

                throw new BusinessRuleException(
                        "A valid email address is required");
            }
        }


        // Validate phone number
        if (request.getPhoneNumber() == null ||
                !PHONE_PATTERN.matcher(
                        request.getPhoneNumber().trim()).matches()) {

            throw new BusinessRuleException(
                    "Valid phone number required (e.g. 0771234567 or +94771234567)");
        }


        // Employee role is required
        if (request.getRole() == null ||
                request.getRole().isBlank()) {

            throw new BusinessRuleException(
                    "Employee role is required");
        }


        // Convert role into standard format
        String normalized =
                normalizeRole(request.getRole());


        // Check whether role is allowed
        if (!VALID_ROLES.contains(normalized)) {

            throw new BusinessRuleException(
                    "Unsupported employee role: " +
                    request.getRole() +
                    ". Allowed roles: " +
                    String.join(", ", VALID_ROLES));
        }
    }


    // Convert role into a standard format
    private String normalizeRole(String role) {

        // Default role
        if (role == null) {
            return "LAUNDRY_STAFF";
        }

        // Remove spaces and convert to uppercase
        String upper =
                role.trim()
                        .toUpperCase()
                        .replace(" ", "_");

        // Convert MANAGER into BRANCH_MANAGER
        if (upper.equals("MANAGER")) {
            return "BRANCH_MANAGER";
        }

        // Convert DRIVER into DELIVERY_DRIVER
        if (upper.equals("DRIVER")) {
            return "DELIVERY_DRIVER";
        }

        return upper;
    }


    // Check whether the role is a manager role
    private boolean isManagerRole(String role) {

        return "MANAGER".equalsIgnoreCase(role) ||
               "BRANCH_MANAGER".equalsIgnoreCase(role);
    }
}
