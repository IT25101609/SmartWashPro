package com.smartwashpro.service;

import com.smartwashpro.dto.request.PickupRequest;
import com.smartwashpro.dto.response.PickupResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.exception.InvalidStatusTransitionException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.*;
import com.smartwashpro.model.enums.OrderStatus;
import com.smartwashpro.model.enums.PickupStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.repository.*;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PickupService {
    private final PickupRepository pickupRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final SecurityUtils securityUtils;

    public PickupService(PickupRepository pickupRepository,
                         OrderRepository orderRepository,
                         CustomerRepository customerRepository,
                         UserRepository userRepository,
                         EmployeeRepository employeeRepository,
                         OrderStatusHistoryRepository statusHistoryRepository,
                         SecurityUtils securityUtils) {
        this.pickupRepository = pickupRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.securityUtils = securityUtils;
    }

    public PickupResponse toResponse(Pickup pickup) {
        if (pickup == null) return null;
        Order order = pickup.getOrder();
        Customer customer = pickup.getCustomer();
        Employee driver = pickup.getDriver();
        User customerUser = customer != null ? customer.getUser() : null;
        User driverUser = driver != null ? driver.getUser() : null;

        return PickupResponse.builder()
                .id(pickup.getId())
                .orderId(order != null ? order.getId() : null)
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customerUser != null ? customerUser.getFullName() : "Customer")
                .customerPhone(customerUser != null ? customerUser.getPhoneNumber() : null)
                .customerEmail(customerUser != null ? customerUser.getEmail() : null)
                .driverId(driver != null ? driver.getId() : null)
                .driverName(driverUser != null ? driverUser.getFullName() : null)
                .driverPhone(driverUser != null ? driverUser.getPhoneNumber() : null)
                .pickupAddress(pickup.getPickupAddress())
                .pickupDate(pickup.getPickupDate())
                .pickupTimeSlot(pickup.getPickupTimeSlot())
                .pickupStatus(pickup.getPickupStatus() != null ? pickup.getPickupStatus().name() : PickupStatus.REQUESTED.name())
                .specialInstruction(pickup.getSpecialInstruction())
                .branchId(pickup.getBranchId())
                .orderStatus(order != null && order.getOrderStatus() != null ? order.getOrderStatus().name() : null)
                .orderTotalPrice(order != null ? order.getTotalPrice() : null)
                .createdAt(pickup.getCreatedAt())
                .updatedAt(pickup.getUpdatedAt())
                .build();
    }

    public Page<PickupResponse> filterPickups(String statusStr,
                                              LocalDate date,
                                              String search,
                                              Long driverId,
                                              Long customerId,
                                              Long branchId,
                                              User currentUser,
                                              Pageable pageable) {
        PickupStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = PickupStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Long filterCustomerId = customerId;
        Long filterBranchId = branchId;
        Long filterDriverId = driverId;

        if (currentUser != null) {
            if (currentUser.getRole() == Role.CUSTOMER) {
                Customer c = customerRepository.findByUserId(currentUser.getId()).orElse(null);
                if (c == null) return Page.empty();
                filterCustomerId = c.getId();
            } else if (currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
                if (!securityUtils.isAdmin()) {
                    Long userBranch = securityUtils.getCurrentUserBranchId();
                    if (userBranch != null) {
                        filterBranchId = userBranch;
                    }
                }
            }
        }

        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return pickupRepository.filterPickups(filterCustomerId, filterBranchId, filterDriverId, status, date, searchTrimmed, pageable)
                .map(this::toResponse);
    }

    public PickupResponse getPickupById(Long id, User currentUser) {
        Pickup pickup = pickupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", id));

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(currentUser.getId()).orElse(null);
            if (customer == null || !pickup.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("Cannot view another customer's pickup request");
            }
        }
        return toResponse(pickup);
    }

    @Transactional
    public PickupResponse createPickup(PickupRequest req, User currentUser) {
        if (req.getOrderId() == null) {
            throw new BusinessRuleException("Order ID is required to schedule a pickup");
        }

        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", req.getOrderId()));

        Customer customer = order.getCustomer();

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Customer currentCustomer = customerRepository.findByUserId(currentUser.getId()).orElse(null);
            if (currentCustomer == null || !customer.getId().equals(currentCustomer.getId())) {
                throw new ForbiddenException("Cannot request pickup for an order that is not yours");
            }
        }

        // Prevent pickup for cancelled or completed/delivered orders
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot create a pickup request for a cancelled order");
        }
        if (order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new BusinessRuleException("Cannot create a pickup request for an order that is already delivered");
        }

        // Check if an active pickup already exists for this order
        Optional<Pickup> activeOpt = pickupRepository.findActiveByOrderId(order.getId());
        if (activeOpt.isPresent()) {
            Pickup existing = activeOpt.get();
            throw new BusinessRuleException("An active pickup request (#" + existing.getId() + ") already exists for Order #" + order.getId() + " (Status: " + existing.getPickupStatus() + ")");
        }

        // Reuse existing cancelled row or create new to honor DB unique constraint on order_id
        Pickup pickup = pickupRepository.findByOrderId(order.getId()).orElse(new Pickup());
        pickup.setOrder(order);
        pickup.setCustomer(customer);
        pickup.setBranchId(order.getBranchId());

        String address = req.getPickupAddress();
        if (address == null || address.isBlank()) {
            address = (customer.getUser() != null && customer.getUser().getAddress() != null)
                    ? customer.getUser().getAddress()
                    : "Customer Address";
        }
        pickup.setPickupAddress(address);

        LocalDate date = req.getPickupDate() != null ? req.getPickupDate() : LocalDate.now();
        pickup.setPickupDate(date);

        String slot = req.getPickupTimeSlot() != null && !req.getPickupTimeSlot().isBlank()
                ? req.getPickupTimeSlot()
                : "08:00 - 10:00";
        pickup.setPickupTimeSlot(slot);

        pickup.setSpecialInstruction(req.getSpecialInstruction());

        // Assign driver if provided by staff/admin
        if (req.getDriverId() != null && (currentUser == null || currentUser.getRole() != Role.CUSTOMER)) {
            Employee driver = employeeRepository.findById(req.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", req.getDriverId()));
            if (driver.getEmploymentStatus() != com.smartwashpro.model.enums.EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Cannot assign driver: Driver #" + req.getDriverId() + " is INACTIVE");
            }
            pickup.setDriver(driver);
            pickup.setPickupStatus(PickupStatus.ASSIGNED);
        } else {
            pickup.setDriver(null);
            pickup.setPickupStatus(PickupStatus.REQUESTED);
        }

        return toResponse(pickupRepository.save(pickup));
    }

    @Transactional
    public PickupResponse assignDriver(Long pickupId, Long driverId, User currentUser) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", pickupId));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            securityUtils.validateBranchAccess(pickup.getBranchId());
        }

        if (pickup.getPickupStatus() == PickupStatus.COLLECTED) {
            throw new BusinessRuleException("Cannot assign driver: Pickup #" + pickupId + " is already marked COLLECTED");
        }
        if (pickup.getPickupStatus() == PickupStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot assign driver: Pickup #" + pickupId + " is CANCELLED");
        }

        Employee driver = employeeRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
        if (driver.getEmploymentStatus() != com.smartwashpro.model.enums.EmploymentStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot assign driver: Driver #" + driverId + " is INACTIVE");
        }

        pickup.setDriver(driver);
        // Advance status from REQUESTED (or SCHEDULED) to ASSIGNED
        if (pickup.getPickupStatus() == PickupStatus.REQUESTED || pickup.getPickupStatus() == PickupStatus.SCHEDULED) {
            pickup.setPickupStatus(PickupStatus.ASSIGNED);
        }

        return toResponse(pickupRepository.save(pickup));
    }

    @Transactional
    public PickupResponse updateStatus(Long pickupId, String newStatusStr, Long driverId, User currentUser) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", pickupId));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            securityUtils.validateBranchAccess(pickup.getBranchId());
        }

        PickupStatus current = pickup.getPickupStatus();
        PickupStatus target;
        try {
            target = PickupStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Invalid pickup status: " + newStatusStr);
        }

        if (current == target) {
            // No status change, but driver might be updated
            if (driverId != null && target == PickupStatus.ASSIGNED) {
                Employee driver = employeeRepository.findById(driverId)
                        .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
                pickup.setDriver(driver);
                return toResponse(pickupRepository.save(pickup));
            }
            return toResponse(pickup);
        }

        // Workflow state machine validation
        // REQUESTED -> ASSIGNED, CANCELLED
        // ASSIGNED -> COLLECTED, CANCELLED
        // COLLECTED -> (terminal)
        // CANCELLED -> (terminal)
        if (current == PickupStatus.COLLECTED) {
            throw new InvalidStatusTransitionException(current.name(), target.name());
        }
        if (current == PickupStatus.CANCELLED) {
            throw new InvalidStatusTransitionException(current.name(), target.name());
        }

        if (current == PickupStatus.REQUESTED || current == PickupStatus.SCHEDULED) {
            if (target != PickupStatus.ASSIGNED && target != PickupStatus.CANCELLED) {
                throw new InvalidStatusTransitionException(current.name(), target.name());
            }
        } else if (current == PickupStatus.ASSIGNED) {
            if (target != PickupStatus.COLLECTED && target != PickupStatus.CANCELLED) {
                throw new InvalidStatusTransitionException(current.name(), target.name());
            }
        }

        if (target == PickupStatus.ASSIGNED && driverId != null) {
            Employee driver = employeeRepository.findById(driverId)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
            pickup.setDriver(driver);
        }

        pickup.setPickupStatus(target);

        // When collected, sync related order status if it was PLACED
        if (target == PickupStatus.COLLECTED) {
            Order order = pickup.getOrder();
            if (order != null && order.getOrderStatus() == OrderStatus.PLACED) {
                order.setOrderStatus(OrderStatus.RECEIVED);
                orderRepository.save(order);
                statusHistoryRepository.save(OrderStatusHistory.builder()
                        .order(order)
                        .oldStatus(OrderStatus.PLACED)
                        .newStatus(OrderStatus.RECEIVED)
                        .changedBy(currentUser)
                        .remarks("Laundry items collected by courier via Pickup #" + pickup.getId())
                        .build());
            }
        }

        return toResponse(pickupRepository.save(pickup));
    }

    @Transactional
    public PickupResponse markAsCollected(Long pickupId, User currentUser) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", pickupId));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            securityUtils.validateBranchAccess(pickup.getBranchId());
        }

        if (pickup.getPickupStatus() == PickupStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot collect a cancelled pickup");
        }
        if (pickup.getPickupStatus() == PickupStatus.COLLECTED) {
            return toResponse(pickup);
        }

        pickup.setPickupStatus(PickupStatus.COLLECTED);

        Order order = pickup.getOrder();
        if (order != null && order.getOrderStatus() == OrderStatus.PLACED) {
            order.setOrderStatus(OrderStatus.RECEIVED);
            orderRepository.save(order);
            statusHistoryRepository.save(OrderStatusHistory.builder()
                    .order(order)
                    .oldStatus(OrderStatus.PLACED)
                    .newStatus(OrderStatus.RECEIVED)
                    .changedBy(currentUser)
                    .remarks("Laundry items collected by courier via Pickup #" + pickup.getId())
                    .build());
        }

        return toResponse(pickupRepository.save(pickup));
    }

    @Transactional
    public PickupResponse cancelPickup(Long pickupId, User currentUser) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", pickupId));

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(currentUser.getId()).orElse(null);
            if (customer == null || !pickup.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("Cannot cancel another customer's pickup");
            }
        } else if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            securityUtils.validateBranchAccess(pickup.getBranchId());
        }

        if (pickup.getPickupStatus() == PickupStatus.COLLECTED) {
            throw new BusinessRuleException("Cannot cancel pickup: Items have already been collected");
        }
        if (pickup.getPickupStatus() == PickupStatus.CANCELLED) {
            return toResponse(pickup);
        }

        pickup.setPickupStatus(PickupStatus.CANCELLED);
        return toResponse(pickupRepository.save(pickup));
    }

    public List<Map<String, Object>> getAvailableDrivers(Long branchId) {
        List<String> driverRoles = List.of("DRIVER", "DELIVERY_DRIVER");
        List<Employee> drivers;
        if (branchId != null) {
            drivers = employeeRepository.findByRoleInAndBranchIdAndEmploymentStatus(driverRoles, branchId, com.smartwashpro.model.enums.EmploymentStatus.ACTIVE);
            if (drivers.isEmpty()) {
                drivers = employeeRepository.findByRoleInAndEmploymentStatus(driverRoles, com.smartwashpro.model.enums.EmploymentStatus.ACTIVE);
            }
        } else {
            drivers = employeeRepository.findByRoleInAndEmploymentStatus(driverRoles, com.smartwashpro.model.enums.EmploymentStatus.ACTIVE);
        }

        return drivers.stream().map(d -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("fullName", d.getUser() != null ? d.getUser().getFullName() : "Driver #" + d.getId());
            map.put("phoneNumber", d.getUser() != null ? d.getUser().getPhoneNumber() : "");
            map.put("branchId", d.getBranchId());
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getEligibleOrders(Long customerId, Long branchId, User currentUser) {
        List<Order> orders;
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Customer c = customerRepository.findByUserId(currentUser.getId()).orElse(null);
            if (c == null) return Collections.emptyList();
            orders = orderRepository.findRecentByCustomerId(c.getId(), Pageable.unpaged());
        } else if (customerId != null) {
            orders = orderRepository.findRecentByCustomerId(customerId, Pageable.unpaged());
        } else if (branchId != null) {
            orders = orderRepository.findByBranchId(branchId, Pageable.ofSize(100)).getContent();
        } else {
            orders = orderRepository.findAll(Pageable.ofSize(100)).getContent();
        }

        return orders.stream()
                .filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED && o.getOrderStatus() != OrderStatus.DELIVERED)
                .filter(o -> {
                    // Filter out orders that already have an active non-cancelled pickup
                    Optional<Pickup> activeOpt = pickupRepository.findActiveByOrderId(o.getId());
                    return activeOpt.isEmpty();
                })
                .map(o -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", o.getId());
                    map.put("customerId", o.getCustomer() != null ? o.getCustomer().getId() : null);
                    map.put("customerName", o.getCustomer() != null && o.getCustomer().getUser() != null ? o.getCustomer().getUser().getFullName() : "Customer");
                    map.put("customerPhone", o.getCustomer() != null && o.getCustomer().getUser() != null ? o.getCustomer().getUser().getPhoneNumber() : "");
                    map.put("customerAddress", o.getCustomer() != null && o.getCustomer().getUser() != null ? o.getCustomer().getUser().getAddress() : "");
                    map.put("totalPrice", o.getTotalPrice());
                    map.put("orderStatus", o.getOrderStatus().name());
                    map.put("branchId", o.getBranchId());
                    return map;
                })
                .collect(Collectors.toList());
    }
}
