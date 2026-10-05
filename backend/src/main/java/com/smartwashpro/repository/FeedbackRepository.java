package com.smartwashpro.repository;

import com.smartwashpro.model.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Page<Feedback> findByCustomerId(Long customerId, Pageable pageable);

    boolean existsByOrderId(Long orderId);

    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double getAverageRating();
}
