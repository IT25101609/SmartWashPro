package com.smartwashpro.dto.response;

import java.time.LocalDateTime;

public class FeedbackResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Long orderId;
    private String orderStatus;
    private LocalDateTime orderDate;
    private Double orderTotalPrice;
    private String feedbackText;
    private String comment;
    private String status;
    private int rating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FeedbackResponse() {}

    public FeedbackResponse(Long id, Long customerId, String customerName, String customerEmail, String customerPhone,
                            Long orderId, String orderStatus, LocalDateTime orderDate, Double orderTotalPrice,
                            String feedbackText, String status, int rating, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.orderId = orderId;
        this.orderStatus = orderStatus;
        this.orderDate = orderDate;
        this.orderTotalPrice = orderTotalPrice;
        this.feedbackText = feedbackText;
        this.comment = feedbackText;
        this.status = status;
        this.rating = rating;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public Double getOrderTotalPrice() { return orderTotalPrice; }
    public void setOrderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; }

    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
        this.comment = feedbackText;
    }

    public String getComment() { return feedbackText; }
    public void setComment(String comment) {
        this.comment = comment;
        this.feedbackText = comment;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long customerId;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private Long orderId;
        private String orderStatus;
        private LocalDateTime orderDate;
        private Double orderTotalPrice;
        private String feedbackText;
        private String status;
        private int rating;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder customerId(Long customerId) { this.customerId = customerId; return this; }
        public Builder customerName(String customerName) { this.customerName = customerName; return this; }
        public Builder customerEmail(String customerEmail) { this.customerEmail = customerEmail; return this; }
        public Builder customerPhone(String customerPhone) { this.customerPhone = customerPhone; return this; }
        public Builder orderId(Long orderId) { this.orderId = orderId; return this; }
        public Builder orderStatus(String orderStatus) { this.orderStatus = orderStatus; return this; }
        public Builder orderDate(LocalDateTime orderDate) { this.orderDate = orderDate; return this; }
        public Builder orderTotalPrice(Double orderTotalPrice) { this.orderTotalPrice = orderTotalPrice; return this; }
        public Builder feedbackText(String feedbackText) { this.feedbackText = feedbackText; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder rating(int rating) { this.rating = rating; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public FeedbackResponse build() {
            return new FeedbackResponse(id, customerId, customerName, customerEmail, customerPhone,
                    orderId, orderStatus, orderDate, orderTotalPrice, feedbackText, status, rating, createdAt, updatedAt);
        }
    }
}
