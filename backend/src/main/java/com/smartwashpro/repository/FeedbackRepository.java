package com.smartwashpro.repository;

import com.smartwashpro.model.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long>, JpaSpecificationExecutor<Feedback> {
    Page<Feedback> findByCustomerId(Long customerId, Pageable pageable);
    List<Feedback> findByCustomerId(Long customerId);
    Optional<Feedback> findByOrderId(Long orderId);
    boolean existsByOrderId(Long orderId);

    @Query("SELECT COALESCE(AVG(f.rating), 0.0) FROM Feedback f")
    Double getAverageRating();

    @Query("SELECT f.rating, COUNT(f) FROM Feedback f GROUP BY f.rating")
    List<Object[]> getRatingCounts();

    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.rating >= 4")
    Long countSatisfiedFeedback();
}
