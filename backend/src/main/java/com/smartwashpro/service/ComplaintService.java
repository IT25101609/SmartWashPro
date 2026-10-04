package com.smartwashpro.service;

import com.smartwashpro.dto.request.ComplaintRequest;
import com.smartwashpro.dto.request.ComplaintResolutionRequest;
import com.smartwashpro.dto.response.ComplaintResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Complaint;
import com.smartwashpro.model.Customer;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.Order;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.ComplaintPriority;
import com.smartwashpro.model.enums.ComplaintStatus;
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.repository.ComplaintRepository;
import com.smartwashpro.repository.CustomerRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.repository.OrderRepository;
import com.smartwashpro.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ComplaintService {
    private final ComplaintRepository complaintRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EmployeeRepository employeeRepository;

    public ComplaintService(ComplaintRepository complaintRepository,
                            CustomerRepository customerRepository,
                            UserRepository userRepository,
                            OrderRepository orderRepository,
                            EmployeeRepository employeeRepository) {
        this.complaintRepository = complaintRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new BusinessRuleException("Complaint subject is required.");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new BusinessRuleException("Complaint description is required.");
        }

        // 1. Resolve Customer
        Customer customer;
        if (user.getRole() == Role.CUSTOMER) {
            customer = customerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + user.getId()));
        } else {
            // Manager or Admin
            if (request.getCustomerId() != null) {
                customer = customerRepository.findById(request.getCustomerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));
            } else if (request.getOrderId() != null) {
                Order ord = orderRepository.findById(request.getOrderId())
                        .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));
                customer = ord.getCustomer();
            } else {
                throw new BusinessRuleException("Please select a customer or provide a linked order for this complaint.");
            }
        }

        // 2. Link Order (if provided)
        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new BusinessRuleException("Order #" + order.getId() + " does not belong to customer " 
                        + customer.getUser().getFullName() + ".");
            }
        }

        // 3. Category & Priority
        String category = request.getCategory() != null && !request.getCategory().trim().isEmpty()
                ? request.getCategory().trim().toUpperCase()
                : "OTHER";

        ComplaintPriority priority = ComplaintPriority.MEDIUM;
        if (request.getPriority() != null) {
            try {
                priority = ComplaintPriority.valueOf(request.getPriority().toUpperCase());
            } catch (Exception ignored) {}
        }

        // 4. Assigned Employee (if provided)
        Employee assignedEmployee = null;
        if (request.getAssignedEmployeeId() != null) {
            assignedEmployee = employeeRepository.findById(request.getAssignedEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getAssignedEmployeeId()));
            if (assignedEmployee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Cannot assign complaint to an inactive employee.");
            }
        }

        ComplaintStatus status = assignedEmployee != null ? ComplaintStatus.IN_PROGRESS : ComplaintStatus.OPEN;
        if (request.getStatus() != null) {
            try {
                status = ComplaintStatus.valueOf(request.getStatus().toUpperCase());
            } catch (Exception ignored) {}
        }

        Complaint complaint = Complaint.builder()
                .customer(customer)
                .order(order)
                .category(category)
                .subject(request.getSubject().trim())
                .description(request.getDescription().trim())
                .priority(priority)
                .status(status)
                .assignedEmployee(assignedEmployee)
                .build();

        complaint = complaintRepository.save(complaint);
        return mapToResponse(complaint);
    }

    public Page<ComplaintResponse> getComplaints(String search,
                                                ComplaintStatus status,
                                                ComplaintPriority priority,
                                                String category,
                                                Long assignedEmployeeId,
                                                Long customerId,
                                                Long orderId,
                                                LocalDate startDate,
                                                LocalDate endDate,
                                                String userEmail,
                                                boolean myOnly,
                                                Pageable pageable) {
        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        final Long effectiveCustomerId;
        if (user != null && user.getRole() == Role.CUSTOMER && myOnly) {
            Customer cust = customerRepository.findByUserId(user.getId()).orElse(null);
            effectiveCustomerId = cust != null ? cust.getId() : -1L;
        } else {
            effectiveCustomerId = customerId;
        }

        Specification<Complaint> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.upper(root.get("category")), category.trim().toUpperCase()));
            }
            if (assignedEmployeeId != null) {
                predicates.add(cb.equal(root.get("assignedEmployee").get("id"), assignedEmployeeId));
            }
            if (effectiveCustomerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), effectiveCustomerId));
            }
            if (orderId != null) {
                predicates.add(cb.equal(root.get("order").get("id"), orderId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(LocalTime.MAX)));
            }

            if (search != null && !search.trim().isEmpty()) {
                String trimmed = search.trim();
                String pattern = "%" + trimmed.toLowerCase() + "%";

                Join<Complaint, Customer> custJoin = root.join("customer", JoinType.LEFT);
                Join<Customer, User> userJoin = custJoin.join("user", JoinType.LEFT);
                Join<Complaint, Employee> empJoin = root.join("assignedEmployee", JoinType.LEFT);
                Join<Employee, User> empUserJoin = empJoin.join("user", JoinType.LEFT);

                Predicate subjectMatch = cb.like(cb.lower(root.get("subject")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate catMatch = cb.like(cb.lower(root.get("category")), pattern);
                Predicate custNameMatch = cb.like(cb.lower(userJoin.get("fullName")), pattern);
                Predicate custEmailMatch = cb.like(cb.lower(userJoin.get("email")), pattern);
                Predicate empNameMatch = cb.like(cb.lower(empUserJoin.get("fullName")), pattern);

                Predicate searchOr = cb.or(subjectMatch, descMatch, catMatch, custNameMatch, custEmailMatch, empNameMatch);

                try {
                    Long searchNum = Long.parseLong(trimmed);
                    Join<Complaint, Order> orderJoin = root.join("order", JoinType.LEFT);
                    Predicate orderMatch = cb.equal(orderJoin.get("id"), searchNum);
                    Predicate complaintIdMatch = cb.equal(root.get("id"), searchNum);
                    searchOr = cb.or(searchOr, orderMatch, complaintIdMatch);
                } catch (NumberFormatException ignored) {}

                predicates.add(searchOr);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return complaintRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    public Page<ComplaintResponse> getMyComplaints(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + user.getId()));
        return complaintRepository.findByCustomerId(customer.getId(), pageable).map(this::mapToResponse);
    }

    public ComplaintResponse getComplaintById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));
        return mapToResponse(complaint);
    }

    @Transactional
    public ComplaintResponse assignEmployee(Long id, Long employeeId, String userEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot assign complaint to an inactive employee.");
        }

        complaint.setAssignedEmployee(employee);
        // Automatically transition to IN_PROGRESS upon employee assignment if currently OPEN
        if (complaint.getStatus() == ComplaintStatus.OPEN) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        }

        complaint = complaintRepository.save(complaint);
        return mapToResponse(complaint);
    }

    @Transactional
    public ComplaintResponse updateStatus(Long id, ComplaintStatus newStatus, String remarks, String userEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));

        ComplaintStatus current = complaint.getStatus();
        if (current == newStatus) {
            return mapToResponse(complaint);
        }

        // Validate workflow: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
        validateStatusTransition(current, newStatus);

        complaint.setStatus(newStatus);
        if (newStatus == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
            if (remarks != null && !remarks.trim().isEmpty()) {
                complaint.setResolution(remarks.trim());
            }
        } else if (newStatus == ComplaintStatus.CLOSED) {
            complaint.setClosedAt(LocalDateTime.now());
            if (complaint.getResolvedAt() == null) {
                complaint.setResolvedAt(LocalDateTime.now());
            }
            if (remarks != null && !remarks.trim().isEmpty() && complaint.getResolution() == null) {
                complaint.setResolution(remarks.trim());
            }
        }

        complaint = complaintRepository.save(complaint);
        return mapToResponse(complaint);
    }

    private void validateStatusTransition(ComplaintStatus from, ComplaintStatus to) {
        if (from == ComplaintStatus.CLOSED && to != ComplaintStatus.CLOSED) {
            throw new BusinessRuleException("Complaint is CLOSED and cannot be modified.");
        }

        Map<ComplaintStatus, List<ComplaintStatus>> allowed = new HashMap<>();
        allowed.put(ComplaintStatus.OPEN, Arrays.asList(ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED));
        allowed.put(ComplaintStatus.IN_PROGRESS, Arrays.asList(ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED));
        allowed.put(ComplaintStatus.RESOLVED, Arrays.asList(ComplaintStatus.CLOSED, ComplaintStatus.IN_PROGRESS));
        allowed.put(ComplaintStatus.CLOSED, Collections.emptyList());

        List<ComplaintStatus> nextValid = allowed.getOrDefault(from, Collections.emptyList());
        if (!nextValid.contains(to)) {
            throw new BusinessRuleException("Invalid status transition from " + from + " to " + to + ".");
        }
    }

    @Transactional
    public ComplaintResponse resolveComplaint(Long id, ComplaintResolutionRequest request, String userEmail) {
        if (request.getResolution() == null || request.getResolution().trim().isEmpty()) {
            throw new BusinessRuleException("Resolution details must be provided to resolve this complaint.");
        }

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));

        complaint.setResolution(request.getResolution().trim());
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(LocalDateTime.now());
        complaint = complaintRepository.save(complaint);
        return mapToResponse(complaint);
    }

    @Transactional
    public ComplaintResponse closeComplaint(Long id, String remarks, String userEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));

        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(LocalDateTime.now());
        if (complaint.getResolvedAt() == null) {
            complaint.setResolvedAt(LocalDateTime.now());
        }
        if (remarks != null && !remarks.trim().isEmpty()) {
            if (complaint.getResolution() == null || complaint.getResolution().trim().isEmpty()) {
                complaint.setResolution(remarks.trim());
            } else {
                complaint.setResolution(complaint.getResolution() + " | Closed: " + remarks.trim());
            }
        }
        complaint = complaintRepository.save(complaint);
        return mapToResponse(complaint);
    }

    @Transactional
    public ComplaintResponse updateComplaint(Long id, ComplaintRequest request, String userEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (user.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
            if (complaint.getCustomer() == null || !complaint.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("You can only modify your own complaints");
            }
        }

        if (request.getCustomerId() != null) {
            Customer cust = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));
            complaint.setCustomer(cust);
        }

        if (request.getSubject() != null && !request.getSubject().trim().isEmpty()) {
            complaint.setSubject(request.getSubject().trim());
        }
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            complaint.setDescription(request.getDescription().trim());
        }
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty()) {
            complaint.setCategory(request.getCategory().trim().toUpperCase());
        }
        if (request.getPriority() != null) {
            try {
                complaint.setPriority(ComplaintPriority.valueOf(request.getPriority().toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (request.getOrderId() != null) {
            if (request.getOrderId() <= 0) {
                complaint.setOrder(null);
            } else {
                Order order = orderRepository.findById(request.getOrderId())
                        .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));
                if (complaint.getCustomer() != null && !order.getCustomer().getId().equals(complaint.getCustomer().getId())) {
                    throw new BusinessRuleException("Order #" + order.getId() + " does not belong to customer " 
                            + complaint.getCustomer().getUser().getFullName() + ".");
                }
                complaint.setOrder(order);
            }
        }
        if (request.getAssignedEmployeeId() != null) {
            if (request.getAssignedEmployeeId() <= 0) {
                complaint.setAssignedEmployee(null);
            } else {
                Employee emp = employeeRepository.findById(request.getAssignedEmployeeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getAssignedEmployeeId()));
                if (emp.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                    throw new BusinessRuleException("Cannot assign complaint to an inactive employee.");
                }
                complaint.setAssignedEmployee(emp);
                if (complaint.getStatus() == ComplaintStatus.OPEN) {
                    complaint.setStatus(ComplaintStatus.IN_PROGRESS);
                }
            }
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                ComplaintStatus newStatus = ComplaintStatus.valueOf(request.getStatus().trim().toUpperCase());
                if (newStatus != complaint.getStatus()) {
                    validateStatusTransition(complaint.getStatus(), newStatus);
                    complaint.setStatus(newStatus);
                    if (newStatus == ComplaintStatus.RESOLVED && complaint.getResolvedAt() == null) {
                        complaint.setResolvedAt(LocalDateTime.now());
                    } else if (newStatus == ComplaintStatus.CLOSED) {
                        if (complaint.getResolvedAt() == null) complaint.setResolvedAt(LocalDateTime.now());
                        complaint.setClosedAt(LocalDateTime.now());
                    }
                }
            } catch (IllegalArgumentException ignored) {}
        }
        if (request.getResolution() != null && !request.getResolution().trim().isEmpty()) {
            complaint.setResolution(request.getResolution().trim());
        }

        complaint = complaintRepository.save(complaint);
        return mapToResponse(complaint);
    }

    @Transactional
    public void deleteComplaint(Long id, String userEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (user.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
            if (complaint.getCustomer() == null || !complaint.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("You can only delete your own complaints");
            }
        }

        complaintRepository.delete(complaint);
    }

    public Map<String, Object> getComplaintStats() {
        long total = complaintRepository.count();
        long open = complaintRepository.countByStatus(ComplaintStatus.OPEN);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long closed = complaintRepository.countByStatus(ComplaintStatus.CLOSED);

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("open", open);
        stats.put("inProgress", inProgress);
        stats.put("resolved", resolved);
        stats.put("closed", closed);
        stats.put("resolutionRate", total > 0 ? Math.round(((resolved + closed) * 100.0) / total) : 100);
        return stats;
    }

    private ComplaintResponse mapToResponse(Complaint complaint) {
        Customer customer = complaint.getCustomer();
        User custUser = customer != null ? customer.getUser() : null;
        Order order = complaint.getOrder();
        Employee emp = complaint.getAssignedEmployee();
        User empUser = emp != null ? emp.getUser() : null;

        return ComplaintResponse.builder()
                .id(complaint.getId())
                .customerId(customer != null ? customer.getId() : null)
                .customerName(custUser != null ? custUser.getFullName() : "Customer")
                .customerEmail(custUser != null ? custUser.getEmail() : null)
                .customerPhone(custUser != null ? custUser.getPhoneNumber() : null)
                .orderId(order != null ? order.getId() : null)
                .orderStatus(order != null && order.getOrderStatus() != null ? order.getOrderStatus().name() : null)
                .orderTotalPrice(order != null ? order.getTotalPrice() : null)
                .category(complaint.getCategory() != null ? complaint.getCategory() : "OTHER")
                .subject(complaint.getSubject())
                .description(complaint.getDescription())
                .priority(complaint.getPriority() != null ? complaint.getPriority().name() : "MEDIUM")
                .status(complaint.getStatus() != null ? complaint.getStatus().name() : "OPEN")
                .assignedEmployeeId(emp != null ? emp.getId() : null)
                .assignedEmployeeName(empUser != null ? empUser.getFullName() : null)
                .resolution(complaint.getResolution())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .resolvedAt(complaint.getResolvedAt())
                .closedAt(complaint.getClosedAt())
                .build();
    }
}
