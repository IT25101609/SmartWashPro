package com.smartwashpro.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class FeedbackRequest {
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;

    private String feedbackText;
    private String comment;
    private Long orderId;
    private Long customerId;

    public FeedbackRequest() {}

    public FeedbackRequest(Integer rating, String feedbackText, Long orderId) {
        this.rating = rating;
        this.feedbackText = feedbackText;
        this.orderId = orderId;
    }

    public FeedbackRequest(Integer rating, String feedbackText, Long orderId, Long customerId) {
        this.rating = rating;
        this.feedbackText = feedbackText;
        this.orderId = orderId;
        this.customerId = customerId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedbackText() {
        if (feedbackText != null && !feedbackText.trim().isEmpty()) {
            return feedbackText;
        }
        return comment;
    }

    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
        if (this.comment == null) {
            this.comment = feedbackText;
        }
    }

    public String getComment() {
        return getFeedbackText();
    }

    public void setComment(String comment) {
        this.comment = comment;
        if (this.feedbackText == null) {
            this.feedbackText = comment;
        }
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }
}
