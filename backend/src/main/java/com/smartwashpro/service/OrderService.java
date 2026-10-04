package com.smartwashpro.service;

import com.smartwashpro.dto.request.OrderRequest;
import com.smartwashpro.dto.request.OrderStatusRequest;
import com.smartwashpro.dto.response.*;
import com.smartwashpro.exception.*;
import com.smartwashpro.model.*;
import com.smartwashpro.model.enums.*;
import com.smartwashpro.repository.*;
import com.smartwashpro.security.SecurityUtils;
import com.smartwashpro.util.NotificationHelper;
import com.smartwashpro.util.ReceiptNumberGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final LaundryServiceRepository laundryServiceRepository;
    private final PaymentRepository paymentRepository;
    private final PickupRepository pickupRepository;
    private final NotificationHelper notificationHelper;
    private final SecurityUtils securityUtils;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        CustomerRepository customerRepository,
                        UserRepository userRepository,
                        LaundryServiceRepository laundryServiceRepository,
                        PaymentRepository paymentRepository,
                        PickupRepository pickupRepository,
                        NotificationHelper notificationHelper,
                        SecurityUtils securityUtils) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.laundryServiceRepository = laundryServiceRepository;
        this.paymentRepository = paymentRepository;
        this.pickupRepository = pickupRepository;
        this.notificationHelper = notificationHelper;
        this.securityUtils = securityUtils;
    }

    @Transactional
    public OrderResponse placeOrder(OrderRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Customer customer;
        Long branchId;
        User receptionist = null;

        if (currentUser.getRole() == Role.CUSTOMER) {
            customer = customerRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
            branchId = request.getBranchId() != null ? request.getBranchId() : 1L;
        } else if (currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            if (request.getCustomerId() == null) {
                throw new BusinessRuleException("Please select an existing customer for this order.");
            }
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));
            Long managerBranchId = securityUtils.getCurrentUserBranchId();
            branchId = managerBranchId != null ? managerBranchId : (request.getBranchId() != null ? request.getBranchId() : 1L);
            securityUtils.validateBranchAccess(branchId);
            receptionist = currentUser;
        } else if (currentUser.getRole() == Role.ADMIN) {
            if (request.getCustomerId() == null) {
                throw new BusinessRuleException("Please select an existing customer for this order.");
            }
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));
            branchId = request.getBranchId() != null ? request.getBranchId() : 1L;
            receptionist = currentUser;
        } else {
            throw new ForbiddenException("Unauthorized to create orders.");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessRuleException("Order must contain at least one service item");
        }

        // Calculate price
        double subtotalPrice = 0.0;
        int totalQuantity = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = Order.builder()
                .customer(customer)
                .receptionist(receptionist)
                .branchId(branchId)
                .specialInstructions(request.getSpecialInstructions())
                .orderStatus(OrderStatus.PLACED)
                .totalPrice(0.0)
                .build();
        order = orderRepository.save(order);

        for (var itemRequest : request.getItems()) {
            LaundryService service = laundryServiceRepository.findById(itemRequest.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service", itemRequest.getServiceId()));
            if (!service.getAvailable()) {
                throw new BusinessRuleException("Service '" + service.getServiceName() + "' is not currently available");
            }
            Double qty = itemRequest.getQuantity() != null && itemRequest.getQuantity() > 0 ? itemRequest.getQuantity() : 1.0;
            double subtotal = service.getPrice() * qty;
            subtotalPrice += subtotal;
            totalQuantity += qty.intValue();

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .laundryService(service)
                    .serviceName(service.getServiceName())
                    .quantity(qty)
                    .unitPrice(service.getPrice())
                    .subtotal(subtotal)
                    .specialInstruction(itemRequest.getSpecialInstruction())
                    .build();
            orderItems.add(orderItemRepository.save(item));
        }

        // Apply discount if provided
        double finalPrice = subtotalPrice;
        if (request.getDiscount() != null && request.getDiscount() > 0) {
            finalPrice = Math.max(0.0, subtotalPrice - request.getDiscount());
            String note = order.getSpecialInstructions() != null ? order.getSpecialInstructions() : "";
            note += (note.isEmpty() ? "" : " | ") + "Discount: Rs. " + String.format("%.2f", request.getDiscount());
            order.setSpecialInstructions(note);
        }

        order.setTotalPrice(finalPrice);
        order.setTotalQuantity(totalQuantity);
        order = orderRepository.save(order);

        // Create status history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(null)
                .newStatus(OrderStatus.PLACED)
                .changedBy(currentUser)
                .remarks("Order placed")
                .build();
        statusHistoryRepository.save(history);

        // Create payment record
        Payment payment = Payment.builder()
                .order(order)
                .customer(customer)
                .amount(finalPrice)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH)
                .paymentStatus(PaymentStatus.PENDING)
                .receiptNumber(ReceiptNumberGenerator.generateReceiptNumber())
                .build();
        paymentRepository.save(payment);

        // Create pickup if requested
        if (Boolean.TRUE.equals(request.getRequestPickup()) && request.getPickupAddress() != null) {
            Pickup pickup = Pickup.builder()
                    .order(order)
                    .customer(customer)
                    .branchId(branchId)
                    .pickupAddress(request.getPickupAddress())
                    .pickupDate(request.getPickupDate())
                    .pickupTimeSlot(request.getPickupTimeSlot())
                    .pickupStatus(PickupStatus.REQUESTED)
                    .build();
            pickupRepository.save(pickup);
        }

        // Send notification to customer
        notificationHelper.send(customer.getUser(),
                "Order Placed Successfully",
                "Your order #" + order.getId() + " has been placed. Total: Rs. " + finalPrice,
                NotificationType.ORDER_UPDATE);

        // Update customer stats
        customer.setTotalOrders(customer.getTotalOrders() + 1);
        customerRepository.save(customer);

        return buildOrderResponse(order, orderItems);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatusRequest request, String currentUserEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        securityUtils.validateBranchAccess(order.getBranchId());

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (order.getOrderStatus() == request.getStatus()) {
            return getOrderById(orderId, currentUserEmail);
        }

        validateStatusTransition(order.getOrderStatus(), request.getStatus());

        OrderStatus oldStatus = order.getOrderStatus();
        order.setOrderStatus(request.getStatus());
        orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus(request.getStatus())
                .changedBy(currentUser)
                .remarks(request.getRemarks())
                .build();
        statusHistoryRepository.save(history);

        if (request.getStatus() == OrderStatus.DELIVERED) {
            paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
                if (payment.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
                    payment.setPaymentStatus(PaymentStatus.PAID);
                    paymentRepository.save(payment);
                }
            });
            Customer customer = order.getCustomer();
            customer.setTotalSpent(customer.getTotalSpent() + order.getTotalPrice());
            customerRepository.save(customer);
        }

        notificationHelper.send(order.getCustomer().getUser(),
                "Order Status Updated",
                "Your order #" + orderId + " status is now: " + request.getStatus().name(),
                NotificationType.ORDER_UPDATE);

        return getOrderById(orderId, currentUserEmail);
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.CANCELLED || current == OrderStatus.DELIVERED) {
            throw new InvalidStatusTransitionException(current.name(), next.name());
        }
        Map<OrderStatus, List<OrderStatus>> validTransitions = new HashMap<>();
        validTransitions.put(OrderStatus.PLACED, Arrays.asList(OrderStatus.RECEIVED, OrderStatus.CANCELLED));
        validTransitions.put(OrderStatus.RECEIVED, Arrays.asList(OrderStatus.PROCESSING, OrderStatus.ASSIGNED, OrderStatus.CANCELLED));
        validTransitions.put(OrderStatus.ASSIGNED, Arrays.asList(OrderStatus.PROCESSING, OrderStatus.CANCELLED));
        validTransitions.put(OrderStatus.PROCESSING, Arrays.asList(OrderStatus.READY, OrderStatus.IN_WASH, OrderStatus.CANCELLED));
        validTransitions.put(OrderStatus.IN_WASH, Arrays.asList(OrderStatus.READY, OrderStatus.CANCELLED));
        validTransitions.put(OrderStatus.READY, Arrays.asList(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED));
        validTransitions.put(OrderStatus.OUT_FOR_DELIVERY, Arrays.asList(OrderStatus.DELIVERED, OrderStatus.CANCELLED));

        List<OrderStatus> allowed = validTransitions.getOrDefault(current, Collections.emptyList());
        if (!allowed.contains(next)) {
            throw new InvalidStatusTransitionException(current.name(), next.name());
        }
    }

    public Page<OrderResponse> getAllOrders(Long branchId, OrderStatus status, java.time.LocalDate date, String search, Pageable pageable, String currentEmail) {
        if (currentEmail != null && !currentEmail.equalsIgnoreCase("system")) {
            Optional<User> userOpt = userRepository.findByEmail(currentEmail);
            if (userOpt.isPresent() && userOpt.get().getRole() == Role.CUSTOMER) {
                return getMyOrders(pageable, currentEmail);
            }
        }

        Long effectiveBranchId = null;
        if (securityUtils.isAdmin()) {
            effectiveBranchId = branchId;
        } else {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        java.time.LocalDateTime startDate = null;
        java.time.LocalDateTime endDate = null;
        if (date != null) {
            startDate = date.atStartOfDay();
            endDate = date.atTime(java.time.LocalTime.MAX);
        }

        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return orderRepository.filterOrders(effectiveBranchId, status, startDate, endDate, searchTrimmed, pageable)
                .map(o -> buildOrderResponse(o, o.getItems()));
    }

    @Transactional
    public OrderResponse updateOrder(Long orderId, OrderRequest request, String currentUserEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("Access denied: You can only edit your own orders");
            }
        } else if (currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            securityUtils.validateBranchAccess(order.getBranchId());
        }

        if (order.getOrderStatus() != OrderStatus.PLACED && order.getOrderStatus() != OrderStatus.RECEIVED) {
            throw new BusinessRuleException("Cannot modify order with status: " + order.getOrderStatus() + ". Only PLACED or RECEIVED orders can be edited.");
        }

        if (request.getSpecialInstructions() != null) {
            order.setSpecialInstructions(request.getSpecialInstructions());
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            order.getItems().clear();
            double totalPrice = 0.0;
            int totalQty = 0;
            for (var itemReq : request.getItems()) {
                LaundryService service = laundryServiceRepository.findById(itemReq.getServiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Service", itemReq.getServiceId()));
                double unitPrice = service.getPrice();
                Double qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : 1.0;
                double subtotal = unitPrice * qty;
                totalPrice += subtotal;
                totalQty += qty.intValue();

                OrderItem item = OrderItem.builder()
                        .order(order)
                        .laundryService(service)
                        .serviceName(service.getServiceName())
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .specialInstruction(itemReq.getSpecialInstruction())
                        .build();
                order.getItems().add(item);
            }
            order.setTotalPrice(totalPrice);
            order.setTotalQuantity(totalQty);

            paymentRepository.findByOrderId(orderId).ifPresent(p -> {
                if (p.getPaymentStatus() == PaymentStatus.PENDING) {
                    p.setAmount(order.getTotalPrice());
                    paymentRepository.save(p);
                }
            });
        }

        if (Boolean.TRUE.equals(request.getRequestPickup()) || request.getPickupAddress() != null) {
            Pickup pickup = pickupRepository.findByOrderId(orderId).orElse(null);
            if (pickup == null) {
                pickup = Pickup.builder()
                        .order(order)
                        .customer(order.getCustomer())
                        .branchId(order.getBranchId())
                        .pickupStatus(PickupStatus.REQUESTED)
                        .build();
            }
            if (request.getPickupAddress() != null) pickup.setPickupAddress(request.getPickupAddress());
            if (request.getPickupDate() != null) pickup.setPickupDate(request.getPickupDate());
            if (request.getPickupTimeSlot() != null) pickup.setPickupTimeSlot(request.getPickupTimeSlot());
            pickupRepository.save(pickup);
        }

        orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(order.getOrderStatus())
                .newStatus(order.getOrderStatus())
                .changedBy(currentUser)
                .remarks("Order details updated")
                .build();
        statusHistoryRepository.save(history);

        return buildOrderResponse(order, order.getItems());
    }

    @Transactional
    public void deleteOrder(Long orderId, String currentUserEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("Access denied: You can only cancel your own orders");
            }
        } else if (currentUser.getRole() == Role.BRANCH_MANAGER_ADMIN) {
            securityUtils.validateBranchAccess(order.getBranchId());
        }

        if (order.getOrderStatus() != OrderStatus.PLACED && order.getOrderStatus() != OrderStatus.RECEIVED) {
            throw new BusinessRuleException("Cannot cancel order with status: " + order.getOrderStatus() + ". Only PLACED or RECEIVED orders can be cancelled.");
        }

        OrderStatus oldStatus = order.getOrderStatus();
        order.setOrderStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus(OrderStatus.CANCELLED)
                .changedBy(currentUser)
                .remarks("Order cancelled by " + currentUser.getRole().name())
                .build();
        statusHistoryRepository.save(history);

        paymentRepository.findByOrderId(orderId).ifPresent(p -> {
            if (p.getPaymentStatus() == PaymentStatus.PENDING) {
                p.setPaymentStatus(PaymentStatus.FAILED);
                paymentRepository.save(p);
            }
        });

        pickupRepository.findByOrderId(orderId).ifPresent(pk -> {
            if (pk.getPickupStatus() == PickupStatus.REQUESTED || pk.getPickupStatus() == PickupStatus.SCHEDULED) {
                pk.setPickupStatus(PickupStatus.CANCELLED);
                pickupRepository.save(pk);
            }
        });

        notificationHelper.send(order.getCustomer().getUser(),
                "Order Cancelled",
                "Your order #" + orderId + " has been cancelled.",
                NotificationType.ORDER_UPDATE);
    }

    public Page<OrderResponse> getOrdersByCustomer(Long customerId, Pageable pageable, String currentEmail) {
        User user = userRepository.findByEmail(currentEmail).orElseThrow();
        if (user.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(user.getId()).orElseThrow();
            if (!customer.getId().equals(customerId)) {
                throw new ForbiddenException("You can only view your own orders");
            }
        }
        return orderRepository.findByCustomerId(customerId, pageable)
                .map(o -> buildOrderResponse(o, o.getItems()));
    }

    public Page<OrderResponse> getMyOrders(Pageable pageable, String currentEmail) {
        User user = userRepository.findByEmail(currentEmail).orElseThrow();
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
        return orderRepository.findByCustomerId(customer.getId(), pageable)
                .map(o -> buildOrderResponse(o, o.getItems()));
    }

    public OrderResponse getOrderById(Long id, String currentEmail) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        if (currentEmail != null && !currentEmail.equalsIgnoreCase("system")) {
            userRepository.findByEmail(currentEmail).ifPresent(user -> {
                if (user.getRole() == Role.CUSTOMER) {
                    customerRepository.findByUserId(user.getId()).ifPresent(customer -> {
                        if (!order.getCustomer().getId().equals(customer.getId())) {
                            throw new ForbiddenException("Access denied: You can only view your own order");
                        }
                    });
                } else if (user.getRole() == Role.BRANCH_MANAGER_ADMIN) {
                    securityUtils.validateBranchAccess(order.getBranchId());
                }
            });
        }

        return buildOrderResponse(order, order.getItems());
    }

    private OrderResponse buildOrderResponse(Order order, List<OrderItem> items) {
        List<OrderItemResponse> itemResponses = items.stream().map(item ->
            OrderItemResponse.builder()
                .id(item.getId())
                .serviceId(item.getLaundryService() != null ? item.getLaundryService().getId() : null)
                .serviceName(item.getServiceName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .specialInstruction(item.getSpecialInstruction())
                .build()
        ).toList();

        List<OrderStatusHistoryResponse> historyResponses = statusHistoryRepository
                .findByOrderIdOrderByChangedAtAsc(order.getId()).stream().map(h ->
            OrderStatusHistoryResponse.builder()
                .id(h.getId())
                .oldStatus(h.getOldStatus() != null ? h.getOldStatus().name() : null)
                .newStatus(h.getNewStatus().name())
                .changedBy(h.getChangedBy() != null ? h.getChangedBy().getFullName() : "System")
                .remarks(h.getRemarks())
                .changedAt(h.getChangedAt())
                .build()
        ).toList();

        CustomerResponse customerResponse = null;
        if (order.getCustomer() != null) {
            User cu = order.getCustomer().getUser();
            customerResponse = CustomerResponse.builder()
                .id(order.getCustomer().getId())
                .userId(cu.getId())
                .fullName(cu.getFullName())
                .email(cu.getEmail())
                .phoneNumber(cu.getPhoneNumber())
                .build();
        }

        PaymentResponse paymentResponse = paymentRepository.findByOrderId(order.getId())
                .map(p -> PaymentResponse.builder()
                    .id(p.getId())
                    .orderId(order.getId())
                    .amount(p.getAmount())
                    .paymentMethod(p.getPaymentMethod().name())
                    .paymentStatus(p.getPaymentStatus().name())
                    .receiptNumber(p.getReceiptNumber())
                    .build()).orElse(null);

        PickupResponse pickupResponse = pickupRepository.findByOrderId(order.getId())
                .map(pk -> PickupResponse.builder()
                    .id(pk.getId())
                    .orderId(order.getId())
                    .pickupAddress(pk.getPickupAddress())
                    .pickupDate(pk.getPickupDate())
                    .pickupTimeSlot(pk.getPickupTimeSlot())
                    .pickupStatus(pk.getPickupStatus().name())
                    .build()).orElse(null);

        return OrderResponse.builder()
                .id(order.getId())
                .customer(customerResponse)
                .receptionistName(order.getReceptionist() != null ? order.getReceptionist().getFullName() : null)
                .branchId(order.getBranchId())
                .orderDate(order.getOrderDate())
                .pickupDate(order.getPickupDate())
                .deliveryDate(order.getDeliveryDate())
                .totalWeight(order.getTotalWeight())
                .totalQuantity(order.getTotalQuantity())
                .totalPrice(order.getTotalPrice())
                .specialInstructions(order.getSpecialInstructions())
                .orderStatus(order.getOrderStatus().name())
                .items(itemResponses)
                .statusHistory(historyResponses)
                .payment(paymentResponse)
                .pickup(pickupResponse)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
