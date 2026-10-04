package com.smartwashpro.service;

import com.smartwashpro.dto.request.EmployeeRequest;
import com.smartwashpro.dto.response.AttendanceResponse;
import com.smartwashpro.dto.response.EmployeeResponse;
import com.smartwashpro.dto.response.TaskResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.DuplicateResourceException;
import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.EmployeeTask;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.TaskStatus;
import com.smartwashpro.model.enums.UserStatus;
import com.smartwashpro.repository.AttendanceRepository;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.repository.EmployeeTaskRepository;
import com.smartwashpro.repository.UserRepository;
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

@Service
public class EmployeeService {

    private static final List<String> VALID_ROLES = Arrays.asList(
            "MANAGER", "BRANCH_MANAGER",
            "RECEPTIONIST",
            "LAUNDRY_STAFF",
            "DRIVER", "DELIVERY_DRIVER",
            "MAINTENANCE_STAFF",
            "FINANCE_LEAD"
    );

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[+0-9\\s\\-\\(\\)]{7,25}$");

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final EmployeeTaskRepository employeeTaskRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;

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

    public Page<EmployeeResponse> getAllEmployees(String search, Long branchId, String role, EmploymentStatus status, Pageable pageable) {
        Long effectiveBranchId = branchId;
        if (!securityUtils.isAdmin()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String roleTrimmed = (role != null && !role.trim().isEmpty() && !role.equalsIgnoreCase("ALL")) ? role.trim().toUpperCase() : null;

        Page<Employee> page = employeeRepository.filterEmployees(effectiveBranchId, status, roleTrimmed, searchTrimmed, pageable);
        return page.map(this::mapToResponse);
    }

    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());
        return mapToResponse(employee);
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        validateEmployeeRequest(request, true);

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new DuplicateResourceException("User email already registered: " + request.getEmail());
        }

        Long targetBranchId;
        if (securityUtils.isAdmin()) {
            targetBranchId = request.getBranchId();
            if (targetBranchId != null && !branchRepository.existsById(targetBranchId)) {
                throw new ResourceNotFoundException("Branch", targetBranchId);
            }
        } else {
            targetBranchId = securityUtils.getCurrentUserBranchId();
        }

        String normalizedRole = normalizeRole(request.getRole());
        Role userSecurityRole = isManagerRole(normalizedRole) ? Role.BRANCH_MANAGER_ADMIN : Role.CUSTOMER;

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword().trim() : "password123";

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(userSecurityRole)
                .status(UserStatus.ACTIVE)
                .branchId(targetBranchId)
                .build();
        user = userRepository.save(user);

        EmploymentStatus status = EmploymentStatus.ACTIVE;
        if (request.getEmploymentStatus() != null && !request.getEmploymentStatus().isBlank()) {
            try {
                status = EmploymentStatus.valueOf(request.getEmploymentStatus().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Employee employee = Employee.builder()
                .user(user)
                .role(normalizedRole)
                .employmentStatus(status)
                .branchId(targetBranchId)
                .hireDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now())
                .build();

        Employee saved = employeeRepository.save(employee);
        return mapToResponse(saved);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());

        User user = employee.getUser();
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null) {
            if (!request.getPhoneNumber().isBlank() && !PHONE_PATTERN.matcher(request.getPhoneNumber().trim()).matches()) {
                throw new BusinessRuleException("Phone number must be at least 7 digits and contain valid phone characters");
            }
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            String normalizedRole = normalizeRole(request.getRole());
            employee.setRole(normalizedRole);
            if (isManagerRole(normalizedRole)) {
                user.setRole(Role.BRANCH_MANAGER_ADMIN);
            } else if (user.getRole() == Role.BRANCH_MANAGER_ADMIN) {
                user.setRole(Role.CUSTOMER);
            }
        }

        if (request.getHireDate() != null) {
            employee.setHireDate(request.getHireDate());
        }

        if (request.getBranchId() != null) {
            assignBranchInternal(employee, user, request.getBranchId());
        }

        if (request.getEmploymentStatus() != null && !request.getEmploymentStatus().isBlank()) {
            try {
                EmploymentStatus status = EmploymentStatus.valueOf(request.getEmploymentStatus().trim().toUpperCase());
                employee.setEmploymentStatus(status);
                if (status == EmploymentStatus.ACTIVE) {
                    user.setStatus(UserStatus.ACTIVE);
                } else if (status == EmploymentStatus.INACTIVE) {
                    user.setStatus(UserStatus.BLOCKED);
                }
            } catch (IllegalArgumentException e) {
                throw new BusinessRuleException("Invalid employment status: " + request.getEmploymentStatus());
            }
        }

        userRepository.save(user);
        Employee updated = employeeRepository.save(employee);
        return mapToResponse(updated);
    }

    @Transactional
    public EmployeeResponse assignBranch(Long id, Long branchId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());

        assignBranchInternal(employee, employee.getUser(), branchId);
        userRepository.save(employee.getUser());
        return mapToResponse(employeeRepository.save(employee));
    }

    private void assignBranchInternal(Employee employee, User user, Long branchId) {
        if (!securityUtils.isAdmin()) {
            Long currentBranchId = securityUtils.getCurrentUserBranchId();
            if (branchId != null && !branchId.equals(currentBranchId)) {
                throw new ForbiddenException("Only System Administrators can reassign employees to a different branch");
            }
        }
        if (branchId != null && !branchRepository.existsById(branchId)) {
            throw new ResourceNotFoundException("Branch", branchId);
        }
        employee.setBranchId(branchId);
        if (user != null) {
            user.setBranchId(branchId);
        }
    }

    @Transactional
    public EmployeeResponse activateEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());

        employee.setEmploymentStatus(EmploymentStatus.ACTIVE);
        if (employee.getUser() != null) {
            employee.getUser().setStatus(UserStatus.ACTIVE);
            userRepository.save(employee.getUser());
        }
        return mapToResponse(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponse deactivateEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());

        boolean isTargetBranchManager = isManagerRole(employee.getRole()) ||
                (employee.getUser() != null && employee.getUser().getRole() == Role.BRANCH_MANAGER_ADMIN);

        if (isTargetBranchManager && !securityUtils.isAdmin()) {
            throw new ForbiddenException("A Branch Manager cannot deactivate another Branch Manager. Only System Admin can perform this action.");
        }

        employee.setEmploymentStatus(EmploymentStatus.INACTIVE);
        if (employee.getUser() != null) {
            employee.getUser().setStatus(UserStatus.BLOCKED);
            userRepository.save(employee.getUser());
        }
        return mapToResponse(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponse toggleStatus(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());

        if (employee.getEmploymentStatus() == EmploymentStatus.ACTIVE) {
            return deactivateEmployee(id);
        } else {
            return activateEmployee(id);
        }
    }

    public Page<TaskResponse> getEmployeeTasks(Long id, Pageable pageable) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());

        return employeeTaskRepository.findByEmployeeId(id, pageable).map(this::mapTaskToResponse);
    }

    public Page<AttendanceResponse> getEmployeeAttendance(Long id, Pageable pageable) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        securityUtils.validateBranchAccess(employee.getBranchId());

        return attendanceRepository.filterAttendance(null, id, null, null, pageable)
                .map(a -> AttendanceResponse.builder()
                        .id(a.getId())
                        .employeeId(a.getEmployee().getId())
                        .employeeName(a.getEmployee().getUser() != null ? a.getEmployee().getUser().getFullName() : "Employee #" + a.getEmployee().getId())
                        .employeeRole(a.getEmployee().getRole())
                        .branchId(a.getEmployee().getBranchId())
                        .date(a.getDate())
                        .checkIn(a.getCheckIn())
                        .checkOut(a.getCheckOut())
                        .attendanceStatus(a.getAttendanceStatus().name())
                        .build());
    }

    public EmployeeResponse mapToResponse(Employee employee) {
        User user = employee.getUser();
        String branchName = null;
        String branchCode = null;
        if (employee.getBranchId() != null) {
            Branch b = branchRepository.findById(employee.getBranchId()).orElse(null);
            if (b != null) {
                branchName = b.getBranchName();
                branchCode = b.getBranchCode();
            }
        }

        long assignedTasks = employeeTaskRepository.countByEmployeeId(employee.getId());
        long completedTasks = employeeTaskRepository.countByEmployeeIdAndTaskStatus(employee.getId(), TaskStatus.COMPLETED);
        long attendanceCount = attendanceRepository.countByEmployeeId(employee.getId());

        return EmployeeResponse.builder()
                .id(employee.getId())
                .userId(user != null ? user.getId() : null)
                .fullName(user != null ? user.getFullName() : "")
                .email(user != null ? user.getEmail() : "")
                .phoneNumber(user != null ? user.getPhoneNumber() : "")
                .address(user != null ? user.getAddress() : "")
                .role(employee.getRole() != null ? employee.getRole() : "")
                .employmentStatus(employee.getEmploymentStatus() != null ? employee.getEmploymentStatus().name() : "ACTIVE")
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

    private TaskResponse mapTaskToResponse(EmployeeTask t) {
        return TaskResponse.builder()
                .id(t.getId())
                .employeeId(t.getEmployee().getId())
                .employeeName(t.getEmployee().getUser() != null ? t.getEmployee().getUser().getFullName() : "")
                .orderId(t.getOrder() != null ? t.getOrder().getId() : null)
                .taskType(t.getTaskType() != null ? t.getTaskType().name() : null)
                .taskDescription(t.getTaskDescription())
                .priority(t.getPriority() != null ? t.getPriority().name() : "MEDIUM")
                .assignedDate(t.getAssignedDate())
                .dueDate(t.getDueDate())
                .taskStatus(t.getTaskStatus() != null ? t.getTaskStatus().name() : "PENDING")
                .assignedByName(t.getAssignedBy() != null ? t.getAssignedBy().getFullName() : null)
                .build();
    }

    private void validateEmployeeRequest(EmployeeRequest request, boolean isCreate) {
        if (request.getFullName() == null || request.getFullName().trim().length() < 2) {
            throw new BusinessRuleException("Full name is required and must be at least 2 characters");
        }
        if (isCreate) {
            if (request.getEmail() == null || !request.getEmail().contains("@")) {
                throw new BusinessRuleException("A valid email address is required");
            }
        }
        if (request.getPhoneNumber() == null || !PHONE_PATTERN.matcher(request.getPhoneNumber().trim()).matches()) {
            throw new BusinessRuleException("Valid phone number required (e.g. 0771234567 or +94771234567)");
        }
        if (request.getRole() == null || request.getRole().isBlank()) {
            throw new BusinessRuleException("Employee role is required");
        }
        String normalized = normalizeRole(request.getRole());
        if (!VALID_ROLES.contains(normalized)) {
            throw new BusinessRuleException("Unsupported employee role: " + request.getRole() +
                    ". Allowed roles: " + String.join(", ", VALID_ROLES));
        }
    }

    private String normalizeRole(String role) {
        if (role == null) return "LAUNDRY_STAFF";
        String upper = role.trim().toUpperCase().replace(" ", "_");
        if (upper.equals("MANAGER")) return "BRANCH_MANAGER";
        if (upper.equals("DRIVER")) return "DELIVERY_DRIVER";
        return upper;
    }

    private boolean isManagerRole(String role) {
        return "MANAGER".equalsIgnoreCase(role) || "BRANCH_MANAGER".equalsIgnoreCase(role);
    }
}
