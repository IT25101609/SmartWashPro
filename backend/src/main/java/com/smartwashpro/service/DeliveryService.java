package com.smartwashpro.service;

import com.smartwashpro.dto.request.DeliveryRequest;
import com.smartwashpro.dto.response.DeliveryResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.exception.InvalidStatusTransitionException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.*;
import com.smartwashpro.model.enums.DeliveryStatus;
import com.smartwashpro.model.enums.OrderStatus;
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
public class DeliveryService {
    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final SecurityUtils securityUtils;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           OrderRepository orderRepository,
                           CustomerRepository customerRepository,
                           UserRepository userRepository,
                           EmployeeRepository employeeRepository,
                           OrderStatusHistoryRepository statusHistoryRepository,
                           SecurityUtils securityUtils) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.securityUtils = securityUtils;
    }

    public DeliveryResponse toResponse(Delivery d) {
        if (d == null) return null;
        Order order = d.getOrder();
        Customer customer = d.getCustomer();
        Employee driver = d.getDriver();
        User customerUser = customer != null ? customer.getUser() : null;
        User driverUser = driver != null ? driver.getUser() : null;

        return DeliveryResponse.builder()
                .id(d.getId())
                .orderId(order != null ? order.getId() : null)
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customerUser != null ? customerUser.getFullName() : "Customer")
                .customerPhone(customerUser != null ? customerUser.getPhoneNumber() : null)
                .customerEmail(customerUser != null ? customerUser.getEmail() : null)
                .driverId(driver != null ? driver.getId() : null)
                .driverName(driverUser != null ? driverUser.getFullName() : null)
                .driverPhone(driverUser != null ? driverUser.getPhoneNumber() : null)
                .deliveryAddress(d.getDeliveryAddress())
                .deliveryDate(d.getDeliveryDate())
                .estimatedTime(d.getEstimatedTime())
                .deliveryStatus(d.getDeliveryStatus() != null ? d.getDeliveryStatus().name() : DeliveryStatus.PENDING.name())
                .paymentStatus(d.getPaymentStatus() != null ? d.getPaymentStatus().name() : "NOT_APPLICABLE")
                .orderStatus(order != null && order.getOrderStatus() != null ? order.getOrderStatus().name() : null)
                .orderTotalPrice(order != null ? order.getTotalPrice() : null)
                .branchId(order != null ? order.getBranchId() : null)
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    public Page<DeliveryResponse> filterDeliveries(String statusStr,
                                                   LocalDate date,
                                                   String search,
                                                   Long driverId,
                                                   Long customerId,
                                                   Long branchId,
                                                   User currentUser,
                                                   Pageable pageable) {
        DeliveryStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = DeliveryStatus.valueOf(statusStr.toUpperCase());
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

        return deliveryRepository.filterDeliveries(filterCustomerId, filterBranchId, filterDriverId, status, date, searchTrimmed, pageable)
                .map(this::toResponse);
    }

    public DeliveryResponse getDeliveryById(Long id, User currentUser) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", id));

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(currentUser.getId()).orElse(null);
            if (customer == null || !delivery.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("Cannot view another customer's delivery");
            }
        }
        return toResponse(delivery);
    }

    @Transactional
    public DeliveryResponse createDelivery(DeliveryRequest req, User currentUser) {
        if (req.getOrderId() == null) {
            throw new BusinessRuleException("Order ID is required to schedule a delivery");
        }

        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", req.getOrderId()));

        Customer customer = order.getCustomer();

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Customer currentCustomer = customerRepository.findByUserId(currentUser.getId()).orElse(null);
            if (currentCustomer == null || !customer.getId().equals(currentCustomer.getId())) {
                throw new ForbiddenException("Cannot schedule delivery for an order that is not yours");
            }
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot create a delivery for a cancelled order");
        }
        if (order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new BusinessRuleException("Cannot create a delivery for an order that is already delivered");
        }

        // Check for active delivery for this order
        Optional<Delivery> activeOpt = deliveryRepository.findActiveByOrderId(order.getId());
        if (activeOpt.isPresent()) {
            Delivery existing = activeOpt.get();
            throw new BusinessRuleException("An active delivery (#" + existing.getId() + ") already exists for Order #" + order.getId() + " (Status: " + existing.getDeliveryStatus() + ")");
        }

        // Reuse existing row if order previously had a cancelled/failed delivery, or create new
        Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(new Delivery());
        delivery.setOrder(order);
        delivery.setCustomer(customer);

        String address = req.getDeliveryAddress();
        if (address == null || address.isBlank()) {
            address = (customer.getUser() != null && customer.getUser().getAddress() != null)
                    ? customer.getUser().getAddress()
                    : "Customer Delivery Address";
        }
        delivery.setDeliveryAddress(address);

        LocalDate date = req.getDeliveryDate() != null ? req.getDeliveryDate() : LocalDate.now();
        delivery.setDeliveryDate(date);

        String slot = req.getEstimatedTime() != null && !req.getEstimatedTime().isBlank()
                ? req.getEstimatedTime()
                : "14:00 - 16:00";
        delivery.setEstimatedTime(slot);

        // Driver assignment
        if (req.getDriverId() != null && (currentUser == null || currentUser.getRole() != Role.CUSTOMER)) {
            Employee driver = employeeRepository.findById(req.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", req.getDriverId()));
            if (driver.getEmploymentStatus() != com.smartwashpro.model.enums.EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Cannot assign driver: Driver #" + req.getDriverId() + " is INACTIVE");
            }
            delivery.setDriver(driver);
            delivery.setDeliveryStatus(DeliveryStatus.ASSIGNED);
        } else {
            delivery.setDriver(null);
            delivery.setDeliveryStatus(DeliveryStatus.PENDING);
        }

        return toResponse(deliveryRepository.save(delivery));
    }

    @Transactional
    public DeliveryResponse assignDriver(Long deliveryId, Long driverId, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (delivery.getOrder() != null) {
                securityUtils.validateBranchAccess(delivery.getOrder().getBranchId());
            }
        }

        if (delivery.getDeliveryStatus() == DeliveryStatus.DELIVERED) {
            throw new BusinessRuleException("Cannot reassign driver: Delivery #" + deliveryId + " is already DELIVERED");
        }
        if (delivery.getDeliveryStatus() == DeliveryStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot assign driver: Delivery #" + deliveryId + " is CANCELLED");
        }

        Employee driver = employeeRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
        if (driver.getEmploymentStatus() != com.smartwashpro.model.enums.EmploymentStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot assign driver: Driver #" + driverId + " is INACTIVE");
        }

        delivery.setDriver(driver);
        if (delivery.getDeliveryStatus() == DeliveryStatus.PENDING || delivery.getDeliveryStatus() == DeliveryStatus.FAILED) {
            delivery.setDeliveryStatus(DeliveryStatus.ASSIGNED);
        }

        return toResponse(deliveryRepository.save(delivery));
    }

    @Transactional
    public DeliveryResponse updateStatus(Long deliveryId, String newStatusStr, Long driverId, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (delivery.getOrder() != null) {
                securityUtils.validateBranchAccess(delivery.getOrder().getBranchId());
            }
        }

        DeliveryStatus current = delivery.getDeliveryStatus();
        DeliveryStatus target;
        try {
            target = DeliveryStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Invalid delivery status: " + newStatusStr);
        }

        if (current == target) {
            if (driverId != null && target == DeliveryStatus.ASSIGNED) {
                Employee driver = employeeRepository.findById(driverId)
                        .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
                delivery.setDriver(driver);
                return toResponse(deliveryRepository.save(delivery));
            }
            return toResponse(delivery);
        }

        // Workflow state machine validation:
        // PENDING → ASSIGNED → OUT_FOR_DELIVERY → DELIVERED
        // Allow FAILED when delivery cannot be completed.
        if (current == DeliveryStatus.DELIVERED) {
            throw new InvalidStatusTransitionException(current.name(), target.name());
        }
        if (current == DeliveryStatus.CANCELLED) {
            throw new InvalidStatusTransitionException(current.name(), target.name());
        }

        if (current == DeliveryStatus.PENDING) {
            if (target != DeliveryStatus.ASSIGNED && target != DeliveryStatus.OUT_FOR_DELIVERY && target != DeliveryStatus.FAILED && target != DeliveryStatus.CANCELLED) {
                throw new InvalidStatusTransitionException(current.name(), target.name());
            }
        } else if (current == DeliveryStatus.ASSIGNED) {
            if (target != DeliveryStatus.OUT_FOR_DELIVERY && target != DeliveryStatus.FAILED && target != DeliveryStatus.CANCELLED) {
                throw new InvalidStatusTransitionException(current.name(), target.name());
            }
        } else if (current == DeliveryStatus.OUT_FOR_DELIVERY) {
            if (target != DeliveryStatus.DELIVERED && target != DeliveryStatus.FAILED && target != DeliveryStatus.CANCELLED) {
                throw new InvalidStatusTransitionException(current.name(), target.name());
            }
        } else if (current == DeliveryStatus.FAILED) {
            if (target != DeliveryStatus.ASSIGNED && target != DeliveryStatus.OUT_FOR_DELIVERY && target != DeliveryStatus.PENDING && target != DeliveryStatus.CANCELLED) {
                throw new InvalidStatusTransitionException(current.name(), target.name());
            }
        }

        if (driverId != null) {
            Employee driver = employeeRepository.findById(driverId)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
            delivery.setDriver(driver);
        }

        delivery.setDeliveryStatus(target);

        // Synchronize delivery status with related order:
        Order order = delivery.getOrder();
        if (order != null) {
            if (target == DeliveryStatus.OUT_FOR_DELIVERY) {
                if (order.getOrderStatus() != OrderStatus.OUT_FOR_DELIVERY && order.getOrderStatus() != OrderStatus.DELIVERED) {
                    OrderStatus old = order.getOrderStatus();
                    order.setOrderStatus(OrderStatus.OUT_FOR_DELIVERY);
                    orderRepository.save(order);
                    statusHistoryRepository.save(OrderStatusHistory.builder()
                            .order(order)
                            .oldStatus(old)
                            .newStatus(OrderStatus.OUT_FOR_DELIVERY)
                            .changedBy(currentUser)
                            .remarks("Order is out for doorstep delivery via Delivery #" + delivery.getId())
                            .build());
                }
            } else if (target == DeliveryStatus.DELIVERED) {
                if (order.getOrderStatus() != OrderStatus.DELIVERED) {
                    OrderStatus old = order.getOrderStatus();
                    order.setOrderStatus(OrderStatus.DELIVERED);
                    orderRepository.save(order);
                    statusHistoryRepository.save(OrderStatusHistory.builder()
                            .order(order)
                            .oldStatus(old)
                            .newStatus(OrderStatus.DELIVERED)
                            .changedBy(currentUser)
                            .remarks("Order successfully delivered to customer via Delivery #" + delivery.getId())
                            .build());
                }
            } else if (target == DeliveryStatus.FAILED) {
                if (order.getOrderStatus() == OrderStatus.OUT_FOR_DELIVERY) {
                    order.setOrderStatus(OrderStatus.READY);
                    orderRepository.save(order);
                    statusHistoryRepository.save(OrderStatusHistory.builder()
                            .order(order)
                            .oldStatus(OrderStatus.OUT_FOR_DELIVERY)
                            .newStatus(OrderStatus.READY)
                            .changedBy(currentUser)
                            .remarks("Delivery attempt failed (Delivery #" + delivery.getId() + "). Laundry returned to branch.")
                            .build());
                }
            }
        }

        return toResponse(deliveryRepository.save(delivery));
    }

    @Transactional
    public DeliveryResponse markAsDelivered(Long deliveryId, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (delivery.getOrder() != null) {
                securityUtils.validateBranchAccess(delivery.getOrder().getBranchId());
            }
        }

        if (delivery.getDeliveryStatus() == DeliveryStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot deliver a cancelled delivery");
        }
        if (delivery.getDeliveryStatus() == DeliveryStatus.DELIVERED) {
            return toResponse(delivery);
        }

        delivery.setDeliveryStatus(DeliveryStatus.DELIVERED);

        Order order = delivery.getOrder();
        if (order != null && order.getOrderStatus() != OrderStatus.DELIVERED) {
            OrderStatus old = order.getOrderStatus();
            order.setOrderStatus(OrderStatus.DELIVERED);
            orderRepository.save(order);
            statusHistoryRepository.save(OrderStatusHistory.builder()
                    .order(order)
                    .oldStatus(old)
                    .newStatus(OrderStatus.DELIVERED)
                    .changedBy(currentUser)
                    .remarks("Order successfully delivered to customer via Delivery #" + delivery.getId())
                    .build());
        }

        return toResponse(deliveryRepository.save(delivery));
    }

    @Transactional
    public DeliveryResponse markAsFailed(Long deliveryId, String reason, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        if (currentUser != null && currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (delivery.getOrder() != null) {
                securityUtils.validateBranchAccess(delivery.getOrder().getBranchId());
            }
        }

        if (delivery.getDeliveryStatus() == DeliveryStatus.DELIVERED) {
            throw new BusinessRuleException("Cannot mark as failed: Delivery #" + deliveryId + " has already been completed");
        }
        if (delivery.getDeliveryStatus() == DeliveryStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot mark as failed: Delivery #" + deliveryId + " is CANCELLED");
        }

        delivery.setDeliveryStatus(DeliveryStatus.FAILED);

        Order order = delivery.getOrder();
        if (order != null && order.getOrderStatus() == OrderStatus.OUT_FOR_DELIVERY) {
            order.setOrderStatus(OrderStatus.READY);
            orderRepository.save(order);
            statusHistoryRepository.save(OrderStatusHistory.builder()
                    .order(order)
                    .oldStatus(OrderStatus.OUT_FOR_DELIVERY)
                    .newStatus(OrderStatus.READY)
                    .changedBy(currentUser)
                    .remarks("Delivery attempt failed (Delivery #" + delivery.getId() + "): " + (reason != null ? reason : "Customer unavailable"))
                    .build());
        }

        return toResponse(deliveryRepository.save(delivery));
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
                    // Filter out orders that already have an active non-delivered/non-failed delivery
                    Optional<Delivery> activeOpt = deliveryRepository.findActiveByOrderId(o.getId());
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
