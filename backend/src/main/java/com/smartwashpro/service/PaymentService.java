package com.smartwashpro.service;

import com.smartwashpro.dto.request.PaymentRequest;
import com.smartwashpro.dto.response.PaymentResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Customer;
import com.smartwashpro.model.Notification;
import com.smartwashpro.model.Order;
import com.smartwashpro.model.Payment;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.NotificationType;
import com.smartwashpro.model.enums.OrderStatus;
import com.smartwashpro.model.enums.PaymentMethod;
import com.smartwashpro.model.enums.PaymentStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.CustomerRepository;
import com.smartwashpro.repository.NotificationRepository;
import com.smartwashpro.repository.OrderRepository;
import com.smartwashpro.repository.PaymentRepository;
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.security.SecurityUtils;
import com.smartwashpro.util.ReceiptNumberGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final NotificationRepository notificationRepository;
    private final ReceiptNumberGenerator receiptNumberGenerator;
    private final SecurityUtils securityUtils;

    public PaymentService(PaymentRepository paymentRepository, 
                          OrderRepository orderRepository,
                          CustomerRepository customerRepository,
                          UserRepository userRepository,
                          BranchRepository branchRepository,
                          NotificationRepository notificationRepository,
                          ReceiptNumberGenerator receiptNumberGenerator,
                          SecurityUtils securityUtils) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.notificationRepository = notificationRepository;
        this.receiptNumberGenerator = receiptNumberGenerator;
        this.securityUtils = securityUtils;
    }

    public Page<PaymentResponse> getFilteredPayments(String status, String method, Long branchId, String search, String currentUserEmail, Pageable pageable) {
        Long customerId = null;
        if (currentUserEmail != null) {
            User user = userRepository.findByEmail(currentUserEmail).orElse(null);
            if (user != null && user.getRole() == Role.CUSTOMER) {
                Customer cust = customerRepository.findByUserId(user.getId()).orElse(null);
                if (cust != null) customerId = cust.getId();
            }
        }

        PaymentStatus statusEnum = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                statusEnum = PaymentStatus.valueOf(status.toUpperCase().trim());
            } catch (Exception ignored) {}
        }

        PaymentMethod methodEnum = null;
        if (method != null && !method.isBlank() && !method.equalsIgnoreCase("ALL")) {
            methodEnum = PaymentMethod.fromString(method);
        }

        Long effBranchId = branchId;
        if (!securityUtils.isAdmin()) {
            effBranchId = securityUtils.getCurrentUserBranchId();
        }

        return paymentRepository.filterPayments(customerId, statusEnum, methodEnum, effBranchId, search, pageable)
                .map(this::mapToResponse);
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", id));
        if (!securityUtils.isAdmin() && payment.getOrder() != null) {
            securityUtils.validateBranchAccess(payment.getOrder().getBranchId());
        }
        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment for order", orderId));
        return mapToResponse(payment);
    }

    @Transactional
    public PaymentResponse recordPayment(PaymentRequest request, String currentUserEmail) {
        if (request.getOrderId() == null) {
            throw new BusinessRuleException("Order ID is required to record a payment.");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));

        // 1. Prevent payment for cancelled orders
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot record payment for cancelled Order #" + order.getId() + ".");
        }

        // Determine payment amount
        Double requestedAmount = request.getAmount() != null ? request.getAmount() : order.getTotalPrice();
        if (requestedAmount == null || requestedAmount <= 0) {
            throw new BusinessRuleException("Payment amount must be greater than zero.");
        }

        // 2. Prevent payment greater than allowed amount
        if (requestedAmount > order.getTotalPrice()) {
            throw new BusinessRuleException("Payment amount of Rs. " + requestedAmount + " exceeds the total order amount of Rs. " + order.getTotalPrice() + ".");
        }

        // Check if customer can pay their own order
        if (currentUserEmail != null) {
            User user = userRepository.findByEmail(currentUserEmail).orElse(null);
            if (user != null && user.getRole() == Role.CUSTOMER) {
                Customer cust = customerRepository.findByUserId(user.getId()).orElse(null);
                if (cust != null && order.getCustomer() != null && !order.getCustomer().getId().equals(cust.getId())) {
                    throw new BusinessRuleException("You can only submit payment for your own orders.");
                }
            }
        }

        PaymentMethod method = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH;
        PaymentStatus status = request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PAID;
        String txnRef = request.getTransactionReference() != null && !request.getTransactionReference().isBlank()
                ? request.getTransactionReference()
                : "TXN-" + System.currentTimeMillis();

        // 3. Prevent duplicate payment for the same order (and reuse pending payment if present)
        Optional<Payment> existingOpt = paymentRepository.findByOrderId(order.getId());
        Payment payment;

        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            if (existing.getPaymentStatus() == PaymentStatus.PAID) {
                throw new BusinessRuleException("Order #" + order.getId() + " has already been paid and settled. Receipt: " + existing.getReceiptNumber() + ".");
            }

            // Update existing pending payment
            existing.setAmount(requestedAmount);
            existing.setPaymentMethod(method);
            existing.setPaymentStatus(status);
            existing.setTransactionReference(txnRef);
            if (status == PaymentStatus.PAID) {
                existing.setPaymentDate(LocalDateTime.now());
            }
            payment = paymentRepository.save(existing);
        } else {
            // Create new payment
            String receiptNum = receiptNumberGenerator.generate();
            payment = Payment.builder()
                    .order(order)
                    .customer(order.getCustomer())
                    .amount(requestedAmount)
                    .paymentMethod(method)
                    .paymentStatus(status)
                    .transactionReference(txnRef)
                    .receiptNumber(receiptNum)
                    .paymentDate(status == PaymentStatus.PAID ? LocalDateTime.now() : null)
                    .build();
            payment = paymentRepository.save(payment);
        }

        // 4. Synchronize payment status with related order and customer
        order.setPaymentId(payment.getId());
        orderRepository.save(order);

        if (status == PaymentStatus.PAID && order.getCustomer() != null) {
            Customer cust = order.getCustomer();
            Double prevSpent = cust.getTotalSpent() != null ? cust.getTotalSpent() : 0.0;
            cust.setTotalSpent(prevSpent + payment.getAmount());

            int earnedPoints = (int) (payment.getAmount() / 100);
            int prevPoints = cust.getLoyaltyPoints() != null ? cust.getLoyaltyPoints() : 0;
            cust.setLoyaltyPoints(prevPoints + earnedPoints);
            customerRepository.save(cust);

            // Send notification to customer
            if (cust.getUser() != null) {
                notificationRepository.save(Notification.builder()
                        .user(cust.getUser())
                        .title("💳 Payment Receipt Issued")
                        .message("Receipt " + payment.getReceiptNumber() + " for Rs. " + payment.getAmount().intValue() + " has been verified and settled.")
                        .notificationType(NotificationType.PAYMENT_UPDATE)
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        return mapToResponse(payment);
    }

    @Transactional
    public PaymentResponse updatePaymentStatus(Long id, PaymentStatus newStatus, String transactionReference) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", id));

        PaymentStatus oldStatus = payment.getPaymentStatus();
        payment.setPaymentStatus(newStatus);
        if (transactionReference != null && !transactionReference.isBlank()) {
            payment.setTransactionReference(transactionReference);
        }

        if (newStatus == PaymentStatus.PAID && oldStatus != PaymentStatus.PAID) {
            payment.setPaymentDate(LocalDateTime.now());

            // Sync with customer
            if (payment.getCustomer() != null) {
                Customer cust = payment.getCustomer();
                Double prevSpent = cust.getTotalSpent() != null ? cust.getTotalSpent() : 0.0;
                cust.setTotalSpent(prevSpent + payment.getAmount());

                int earnedPoints = (int) (payment.getAmount() / 100);
                int prevPoints = cust.getLoyaltyPoints() != null ? cust.getLoyaltyPoints() : 0;
                cust.setLoyaltyPoints(prevPoints + earnedPoints);
                customerRepository.save(cust);

                if (cust.getUser() != null) {
                    notificationRepository.save(Notification.builder()
                            .user(cust.getUser())
                            .title("💳 Payment Verified")
                            .message("Payment of Rs. " + payment.getAmount().intValue() + " (Receipt " + payment.getReceiptNumber() + ") marked as PAID.")
                            .notificationType(NotificationType.PAYMENT_UPDATE)
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                }
            }
        }

        return mapToResponse(paymentRepository.save(payment));
    }

    public List<Map<String, Object>> getOrdersPendingPayment(String currentUserEmail) {
        List<Order> orders = orderRepository.findAll();
        Long filterCustId = null;

        if (currentUserEmail != null) {
            User user = userRepository.findByEmail(currentUserEmail).orElse(null);
            if (user != null && user.getRole() == Role.CUSTOMER) {
                Customer cust = customerRepository.findByUserId(user.getId()).orElse(null);
                if (cust != null) filterCustId = cust.getId();
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        Map<Long, String> branchNames = new HashMap<>();
        branchRepository.findAll().forEach(b -> branchNames.put(b.getId(), b.getBranchName()));

        for (Order o : orders) {
            if (o.getOrderStatus() == OrderStatus.CANCELLED) continue;
            if (filterCustId != null && (o.getCustomer() == null || !o.getCustomer().getId().equals(filterCustId))) continue;

            Optional<Payment> pOpt = paymentRepository.findByOrderId(o.getId());
            boolean isPendingOrMissing = pOpt.isEmpty() || pOpt.get().getPaymentStatus() == PaymentStatus.PENDING;

            if (isPendingOrMissing) {
                Map<String, Object> map = new HashMap<>();
                map.put("orderId", o.getId());
                map.put("totalPrice", o.getTotalPrice());
                map.put("orderStatus", o.getOrderStatus().name());
                map.put("customerName", o.getCustomer() != null && o.getCustomer().getUser() != null ? o.getCustomer().getUser().getFullName() : "Customer");
                map.put("customerId", o.getCustomer() != null ? o.getCustomer().getId() : null);
                map.put("branchId", o.getBranchId());
                map.put("branchName", o.getBranchId() != null ? branchNames.getOrDefault(o.getBranchId(), "Colombo Central") : "Colombo Central");
                map.put("orderDate", o.getOrderDate());
                map.put("existingPaymentId", pOpt.map(Payment::getId).orElse(null));
                map.put("existingReceiptNumber", pOpt.map(Payment::getReceiptNumber).orElse(null));
                result.add(map);
            }
        }

        return result;
    }

    private PaymentResponse mapToResponse(Payment payment) {
        String branchName = "Colombo Central";
        Long branchId = null;
        String orderStatus = null;

        if (payment.getOrder() != null) {
            branchId = payment.getOrder().getBranchId();
            if (branchId != null) {
                branchName = branchRepository.findById(branchId).map(Branch::getBranchName).orElse("Colombo Central");
            }
            if (payment.getOrder().getOrderStatus() != null) {
                orderStatus = payment.getOrder().getOrderStatus().name();
            }
        }

        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .customerId(payment.getCustomer() != null ? payment.getCustomer().getId() : null)
                .customerName(payment.getCustomer() != null && payment.getCustomer().getUser() != null ? payment.getCustomer().getUser().getFullName() : "Customer")
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "CASH")
                .paymentStatus(payment.getPaymentStatus() != null ? payment.getPaymentStatus().name() : "PENDING")
                .transactionReference(payment.getTransactionReference())
                .receiptNumber(payment.getReceiptNumber())
                .paymentDate(payment.getPaymentDate())
                .createdAt(payment.getCreatedAt())
                .branchId(branchId)
                .branchName(branchName)
                .orderStatus(orderStatus)
                .build();
    }
}
