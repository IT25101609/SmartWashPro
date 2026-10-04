package com.smartwashpro.repository;

import com.smartwashpro.model.Pickup;
import com.smartwashpro.model.enums.PickupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRepository extends JpaRepository<Pickup, Long> {
    Page<Pickup> findByDriverId(Long driverId, Pageable pageable);
    List<Pickup> findByCustomerId(Long customerId);
    Page<Pickup> findByCustomerId(Long customerId, Pageable pageable);
    Page<Pickup> findByBranchId(Long branchId, Pageable pageable);
    Optional<Pickup> findByOrderId(Long orderId);

    @Query("SELECT p FROM Pickup p WHERE p.order.id = :orderId AND p.pickupStatus != 'CANCELLED'")
    Optional<Pickup> findActiveByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT p FROM Pickup p WHERE " +
           "(:customerId IS NULL OR p.customer.id = :customerId) AND " +
           "(:branchId IS NULL OR p.branchId = :branchId) AND " +
           "(:driverId IS NULL OR (p.driver IS NOT NULL AND p.driver.id = :driverId)) AND " +
           "(:status IS NULL OR p.pickupStatus = :status) AND " +
           "(:date IS NULL OR p.pickupDate = :date) AND " +
           "(:search IS NULL OR :search = '' OR (" +
           "   LOWER(p.customer.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "   LOWER(p.pickupAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "   CONCAT('', p.order.id) LIKE CONCAT('%', :search, '%') OR " +
           "   CONCAT('', p.id) LIKE CONCAT('%', :search, '%') OR " +
           "   (p.driver IS NOT NULL AND LOWER(p.driver.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')))" +
           "))")
    Page<Pickup> filterPickups(
            @Param("customerId") Long customerId,
            @Param("branchId") Long branchId,
            @Param("driverId") Long driverId,
            @Param("status") PickupStatus status,
            @Param("date") LocalDate date,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(p) FROM Pickup p WHERE p.pickupStatus IN ('REQUESTED', 'SCHEDULED', 'ASSIGNED')")
    long countPendingPickups();

    @Query("SELECT COUNT(p) FROM Pickup p WHERE p.pickupDate = :today")
    long countTodayPickups(@Param("today") LocalDate today);
}
