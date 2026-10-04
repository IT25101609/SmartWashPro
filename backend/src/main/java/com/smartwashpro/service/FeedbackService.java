package com.smartwashpro.service;

import com.smartwashpro.dto.request.FeedbackRequest;
import com.smartwashpro.dto.response.FeedbackResponse;
import com.smartwashpro.dto.response.FeedbackStatsResponse;
import com.smartwashpro.dto.response.OrderResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Customer;
import com.smartwashpro.model.Feedback;
import com.smartwashpro.model.Order;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.FeedbackStatus;
import com.smartwashpro.model.enums.OrderStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.repository.CustomerRepository;
import com.smartwashpro.repository.FeedbackRepository;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public FeedbackService(FeedbackRepository feedbackRepository,
                           CustomerRepository customerRepository,
                           UserRepository userRepository,
                           OrderRepository orderRepository) {
        this.feedbackRepository = feedbackRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public FeedbackResponse createFeedback(FeedbackRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        // 1. Validate rating values between 1 and 5
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new BusinessRuleException("Rating must be between 1 and 5.");
        }

        // 2. Validate comment
        String comment = request.getComment();
        if (comment == null || comment.trim().isEmpty()) {
            throw new BusinessRuleException("Please provide a comment for your feedback.");
        }

        // 3. Link to completed/delivered order
        if (request.getOrderId() == null) {
            throw new BusinessRuleException("Feedback must be linked to a completed order.");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));

        // Business Rule: "Only allow feedback for appropriate completed/delivered orders."
        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new BusinessRuleException("Feedback can only be submitted for completed/delivered orders. Order #" 
                    + order.getId() + " is currently in " + order.getOrderStatus() + " status.");
        }

        // Check if feedback already submitted for this order
        if (feedbackRepository.existsByOrderId(order.getId())) {
            throw new BusinessRuleException("Feedback has already been submitted for Order #" + order.getId() + ".");
        }

        // 4. Select / determine customer
        Customer customer;
        if (user.getRole() == Role.CUSTOMER) {
            customer = customerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + user.getId()));
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new BusinessRuleException("You can only submit feedback for your own orders.");
            }
        } else {
            // Manager or Admin recording feedback
            if (request.getCustomerId() != null) {
                customer = customerRepository.findById(request.getCustomerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));
                if (!order.getCustomer().getId().equals(customer.getId())) {
                    throw new BusinessRuleException("The selected customer (ID " + request.getCustomerId() 
                            + ") does not match the customer on Order #" + order.getId() + ".");
                }
            } else {
                customer = order.getCustomer();
            }
        }

        Feedback feedback = Feedback.builder()
                .customer(customer)
                .order(order)
                .rating(request.getRating())
                .feedbackText(comment.trim())
                .status(FeedbackStatus.PUBLISHED)
                .build();

        feedback = feedbackRepository.save(feedback);

        // Award customer 25 bonus loyalty points for submitting feedback
        if (customer != null) {
            int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
            customer.setLoyaltyPoints(currentPoints + 25);
            customerRepository.save(customer);
        }

        return mapToResponse(feedback);
    }

    public Page<FeedbackResponse> getFeedback(Integer rating,
                                             String search,
                                             LocalDate startDate,
                                             LocalDate endDate,
                                             Long customerId,
                                             Long orderId,
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

        Specification<Feedback> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
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

                Join<Feedback, Customer> custJoin = root.join("customer", JoinType.LEFT);
                Join<Customer, User> userJoin = custJoin.join("user", JoinType.LEFT);

                Predicate textMatch = cb.like(cb.lower(root.get("feedbackText")), pattern);
                Predicate custNameMatch = cb.like(cb.lower(userJoin.get("fullName")), pattern);
                Predicate custEmailMatch = cb.like(cb.lower(userJoin.get("email")), pattern);

                Predicate searchOr = cb.or(textMatch, custNameMatch, custEmailMatch);
                try {
                    Long searchNum = Long.parseLong(trimmed);
                    Join<Feedback, Order> orderJoin = root.join("order", JoinType.LEFT);
                    Predicate orderMatch = cb.equal(orderJoin.get("id"), searchNum);
                    searchOr = cb.or(searchOr, orderMatch);
                } catch (NumberFormatException ignored) {}

                predicates.add(searchOr);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return feedbackRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    public Page<FeedbackResponse> getMyFeedback(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + user.getId()));
        return feedbackRepository.findByCustomerId(customer.getId(), pageable).map(this::mapToResponse);
    }

    public FeedbackResponse getFeedbackById(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", id));
        return mapToResponse(feedback);
    }

    public FeedbackStatsResponse getFeedbackStats() {
        Double avgRating = feedbackRepository.getAverageRating();
        long totalCount = feedbackRepository.count();

        Map<Integer, Long> countsMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            countsMap.put(i, 0L);
        }

        List<Object[]> rawCounts = feedbackRepository.getRatingCounts();
        long satisfiedCount = 0;
        for (Object[] row : rawCounts) {
            if (row[0] instanceof Number && row[1] instanceof Number) {
                int r = ((Number) row[0]).intValue();
                long c = ((Number) row[1]).longValue();
                countsMap.put(r, c);
                if (r >= 4) {
                    satisfiedCount += c;
                }
            }
        }

        double satisfactionRate = totalCount > 0 
                ? BigDecimal.valueOf((satisfiedCount * 100.0) / totalCount).setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 100.0;

        double roundedAvg = BigDecimal.valueOf(avgRating != null ? avgRating : 5.0)
                .setScale(1, RoundingMode.HALF_UP).doubleValue();

        return new FeedbackStatsResponse(
                roundedAvg,
                totalCount,
                countsMap.get(5),
                countsMap.get(4),
                countsMap.get(3),
                countsMap.get(2),
                countsMap.get(1),
                satisfactionRate,
                countsMap
        );
    }

    public List<Map<String, Object>> getEligibleOrders(String userEmail, Long customerId) {
        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        List<Order> deliveredOrders;
        if (user != null && user.getRole() == Role.CUSTOMER) {
            Customer cust = customerRepository.findByUserId(user.getId()).orElse(null);
            if (cust == null) return Collections.emptyList();
            deliveredOrders = orderRepository.findByCustomerIdAndOrderStatus(cust.getId(), OrderStatus.DELIVERED);
        } else if (customerId != null) {
            deliveredOrders = orderRepository.findByCustomerIdAndOrderStatus(customerId, OrderStatus.DELIVERED);
        } else {
            deliveredOrders = orderRepository.findByOrderStatus(OrderStatus.DELIVERED);
        }

        return deliveredOrders.stream()
                .filter(o -> !feedbackRepository.existsByOrderId(o.getId()))
                .map(o -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("orderId", o.getId());
                    map.put("customerId", o.getCustomer() != null ? o.getCustomer().getId() : null);
                    map.put("customerName", o.getCustomer() != null && o.getCustomer().getUser() != null 
                            ? o.getCustomer().getUser().getFullName() : "Customer");
                    map.put("orderDate", o.getCreatedAt());
                    map.put("deliveryDate", o.getDeliveryDate());
                    map.put("totalPrice", o.getTotalPrice());
                    map.put("itemCount", o.getItems() != null ? o.getItems().size() : 0);
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public FeedbackResponse updateFeedback(Long id, FeedbackRequest request, String userEmail) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (user.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
            if (feedback.getCustomer() == null || !feedback.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("You can only modify your own feedback");
            }
        }

        if (request.getRating() != null) {
            if (request.getRating() < 1 || request.getRating() > 5) {
                throw new BusinessRuleException("Rating must be between 1 and 5.");
            }
            feedback.setRating(request.getRating());
        }

        String comment = request.getComment();
        if (comment != null && !comment.trim().isEmpty()) {
            feedback.setFeedbackText(comment.trim());
        }

        feedback = feedbackRepository.save(feedback);
        return mapToResponse(feedback);
    }

    @Transactional
    public void deleteFeedback(Long id, String userEmail) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (user.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
            if (feedback.getCustomer() == null || !feedback.getCustomer().getId().equals(customer.getId())) {
                throw new ForbiddenException("You can only delete your own feedback");
            }
        }

        feedbackRepository.delete(feedback);
    }

    private FeedbackResponse mapToResponse(Feedback feedback) {
        Customer customer = feedback.getCustomer();
        User customerUser = customer != null ? customer.getUser() : null;
        Order order = feedback.getOrder();

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customerUser != null ? customerUser.getFullName() : "Valued Customer")
                .customerEmail(customerUser != null ? customerUser.getEmail() : null)
                .customerPhone(customerUser != null ? customerUser.getPhoneNumber() : null)
                .orderId(order != null ? order.getId() : null)
                .orderStatus(order != null && order.getOrderStatus() != null ? order.getOrderStatus().name() : null)
                .orderDate(order != null ? order.getCreatedAt() : null)
                .orderTotalPrice(order != null ? order.getTotalPrice() : null)
                .rating(feedback.getRating())
                .feedbackText(feedback.getFeedbackText())
                .status(feedback.getStatus() != null ? feedback.getStatus().name() : "PUBLISHED")
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }
}
