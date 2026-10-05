package com.smartwashpro.service;

import com.smartwashpro.dto.request.FeedbackRequest;
import com.smartwashpro.dto.response.FeedbackResponse;
import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Customer;
import com.smartwashpro.model.Feedback;
import com.smartwashpro.model.Order;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.FeedbackStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.repository.CustomerRepository;
import com.smartwashpro.repository.FeedbackRepository;
import com.smartwashpro.repository.OrderRepository;
import com.smartwashpro.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public FeedbackService(
            FeedbackRepository feedbackRepository,
            CustomerRepository customerRepository,
            UserRepository userRepository,
            OrderRepository orderRepository
    ) {
        this.feedbackRepository = feedbackRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    // =========================================================
    // CREATE FEEDBACK
    // =========================================================

    @Transactional
    public FeedbackResponse createFeedback(
            FeedbackRequest request,
            String userEmail
    ) {

        // Find logged-in user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userEmail
                        )
                );

        // Find customer profile
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer profile not found for user: "
                                        + user.getId()
                        )
                );

        // =====================================================
        // ORDER ID VALIDATION
        // =====================================================

        if (request.getOrderId() == null) {
            throw new IllegalArgumentException(
                    "Order ID is required."
            );
        }

        if (request.getOrderId() <= 0) {
            throw new IllegalArgumentException(
                    "Order ID must be a valid positive number."
            );
        }

        // =====================================================
        // RATING VALIDATION
        // =====================================================
        // getRating() is int, therefore DO NOT compare with null.

        if (request.getRating() < 1
                || request.getRating() > 5) {

            throw new IllegalArgumentException(
                    "Rating must be between 1 and 5."
            );
        }

        // =====================================================
        // REVIEW VALIDATION
        // =====================================================

        if (request.getFeedbackText() == null
                || request.getFeedbackText().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Feedback review cannot be empty."
            );
        }

        // =====================================================
        // FIND ORDER
        // =====================================================

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Order",
                                request.getOrderId()
                        )
                );

        // =====================================================
        // CUSTOMER OWNERSHIP VALIDATION
        // =====================================================

        if (order.getCustomer() == null
                || order.getCustomer().getId() == null
                || !order.getCustomer()
                .getId()
                .equals(customer.getId())) {

            throw new ForbiddenException(
                    "You can only submit feedback for your own order."
            );
        }

        // =====================================================
        // DUPLICATE FEEDBACK VALIDATION
        // =====================================================

        boolean alreadySubmitted = feedbackRepository.findAll()
                .stream()
                .anyMatch(existingFeedback ->
                        existingFeedback.getOrder() != null
                                && existingFeedback.getOrder().getId() != null
                                && existingFeedback.getOrder()
                                .getId()
                                .equals(order.getId())
                );

        if (alreadySubmitted) {
            throw new IllegalArgumentException(
                    "Feedback has already been submitted for this order."
            );
        }

        // =====================================================
        // CREATE FEEDBACK
        // =====================================================

        Feedback feedback = Feedback.builder()
                .customer(customer)
                .order(order)
                .rating(request.getRating())
                .feedbackText(
                        request.getFeedbackText().trim()
                )
                .status(FeedbackStatus.PUBLISHED)
                .build();

        // Save
        feedback = feedbackRepository.save(feedback);

        return mapToResponse(feedback);
    }

    // =========================================================
    // GET ALL FEEDBACK
    // =========================================================

    public Page<FeedbackResponse> getAllFeedback(
            Pageable pageable
    ) {

        return feedbackRepository
                .findAll(pageable)
                .map(this::mapToResponse);
    }

    // =========================================================
    // GET MY FEEDBACK
    // =========================================================

    public Page<FeedbackResponse> getMyFeedback(
            String userEmail,
            Pageable pageable
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userEmail
                        )
                );

        Customer customer = customerRepository
                .findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer profile not found for user: "
                                        + user.getId()
                        )
                );

        return feedbackRepository
                .findByCustomerId(customer.getId(), pageable)
                .map(this::mapToResponse);
    }

    // =========================================================
    // GET FEEDBACK BY ID
    // =========================================================

    public FeedbackResponse getFeedbackById(Long id) {

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Feedback",
                                id
                        )
                );

        return mapToResponse(feedback);
    }

    // =========================================================
    // UPDATE FEEDBACK
    // =========================================================

    @Transactional
    public FeedbackResponse updateFeedback(
            Long id,
            FeedbackRequest request,
            String userEmail
    ) {

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Feedback",
                                id
                        )
                );

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userEmail
                        )
                );

        // =====================================================
        // CUSTOMER OWNERSHIP CHECK
        // =====================================================

        if (user.getRole() == Role.CUSTOMER) {

            Customer customer = customerRepository
                    .findByUserId(user.getId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Customer profile not found"
                            )
                    );

            if (feedback.getCustomer() == null
                    || feedback.getCustomer().getId() == null
                    || !feedback.getCustomer()
                    .getId()
                    .equals(customer.getId())) {

                throw new ForbiddenException(
                        "You can only modify your own feedback."
                );
            }
        }

        // =====================================================
        // RATING VALIDATION
        // =====================================================
        // getRating() is int, so only range validation is needed.

        if (request.getRating() < 1
                || request.getRating() > 5) {

            throw new IllegalArgumentException(
                    "Rating must be between 1 and 5."
            );
        }

        // =====================================================
        // REVIEW VALIDATION
        // =====================================================

        if (request.getFeedbackText() == null
                || request.getFeedbackText().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Feedback review cannot be empty."
            );
        }

        // =====================================================
        // UPDATE
        // =====================================================

        feedback.setRating(request.getRating());

        feedback.setFeedbackText(
                request.getFeedbackText().trim()
        );

        // IMPORTANT:
        // Existing feedback stays connected to its original order.
        // Customer cannot change the order during an edit.

        feedback = feedbackRepository.save(feedback);

        return mapToResponse(feedback);
    }

    // =========================================================
    // DELETE FEEDBACK
    // =========================================================

    @Transactional
    public void deleteFeedback(
            Long id,
            String userEmail
    ) {

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Feedback",
                                id
                        )
                );

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userEmail
                        )
                );

        // =====================================================
        // CUSTOMER OWNERSHIP CHECK
        // =====================================================

        if (user.getRole() == Role.CUSTOMER) {

            Customer customer = customerRepository
                    .findByUserId(user.getId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Customer profile not found"
                            )
                    );

            if (feedback.getCustomer() == null
                    || feedback.getCustomer().getId() == null
                    || !feedback.getCustomer()
                    .getId()
                    .equals(customer.getId())) {

                throw new ForbiddenException(
                        "You can only delete your own feedback."
                );
            }
        }

        // =====================================================
        // DELETE
        // =====================================================

        feedbackRepository.delete(feedback);
    }

    // =========================================================
    // MAP ENTITY TO RESPONSE
    // =========================================================

    private FeedbackResponse mapToResponse(
            Feedback feedback
    ) {

        return FeedbackResponse.builder()

                .id(feedback.getId())

                .customerId(
                        feedback.getCustomer() != null
                                ? feedback.getCustomer().getId()
                                : null
                )

                .customerName(
                        feedback.getCustomer() != null
                                && feedback.getCustomer().getUser() != null
                                ? feedback.getCustomer()
                                .getUser()
                                .getFullName()
                                : "Customer"
                )

                .orderId(
                        feedback.getOrder() != null
                                ? feedback.getOrder().getId()
                                : null
                )

                .rating(feedback.getRating())

                .feedbackText(
                        feedback.getFeedbackText()
                )

                .status(
                        feedback.getStatus() != null
                                ? feedback.getStatus().name()
                                : "PUBLISHED"
                )

                .createdAt(
                        feedback.getCreatedAt()
                )

                .build();
    }
}
