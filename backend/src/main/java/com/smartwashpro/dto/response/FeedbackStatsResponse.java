package com.smartwashpro.dto.response;

import java.util.Map;

public class FeedbackStatsResponse {
    private Double averageRating;
    private Long totalReviews;
    private Long rating5Count;
    private Long rating4Count;
    private Long rating3Count;
    private Long rating2Count;
    private Long rating1Count;
    private Double satisfactionRate;
    private Map<Integer, Long> ratingCounts;

    public FeedbackStatsResponse() {}

    public FeedbackStatsResponse(Double averageRating, Long totalReviews, Long rating5Count, Long rating4Count,
                                 Long rating3Count, Long rating2Count, Long rating1Count, Double satisfactionRate,
                                 Map<Integer, Long> ratingCounts) {
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
        this.rating5Count = rating5Count;
        this.rating4Count = rating4Count;
        this.rating3Count = rating3Count;
        this.rating2Count = rating2Count;
        this.rating1Count = rating1Count;
        this.satisfactionRate = satisfactionRate;
        this.ratingCounts = ratingCounts;
    }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }

    public Long getRating5Count() { return rating5Count; }
    public void setRating5Count(Long rating5Count) { this.rating5Count = rating5Count; }

    public Long getRating4Count() { return rating4Count; }
    public void setRating4Count(Long rating4Count) { this.rating4Count = rating4Count; }

    public Long getRating3Count() { return rating3Count; }
    public void setRating3Count(Long rating3Count) { this.rating3Count = rating3Count; }

    public Long getRating2Count() { return rating2Count; }
    public void setRating2Count(Long rating2Count) { this.rating2Count = rating2Count; }

    public Long getRating1Count() { return rating1Count; }
    public void setRating1Count(Long rating1Count) { this.rating1Count = rating1Count; }

    public Double getSatisfactionRate() { return satisfactionRate; }
    public void setSatisfactionRate(Double satisfactionRate) { this.satisfactionRate = satisfactionRate; }

    public Map<Integer, Long> getRatingCounts() { return ratingCounts; }
    public void setRatingCounts(Map<Integer, Long> ratingCounts) { this.ratingCounts = ratingCounts; }
}
