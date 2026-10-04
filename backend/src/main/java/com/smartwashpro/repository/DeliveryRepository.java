package com.smartwashpro.repository;

import com.smartwashpro.model.Delivery;
import com.smartwashpro.model.enums.DeliveryStatus;
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
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Page<Delivery> findByDriverId(Long driverId, Pageable pageable);
    Page<Delivery> findByCustomerId(Long customerId, Pageable pageable);
    List<Delivery> findByCustomerId(Long customerId);
    Optional<Delivery> findByOrderId(Long orderId);

    @Query("SELECT d FROM Delivery d WHERE d.order.id = :orderId AND d.deliveryStatus NOT IN ('DELIVERED', 'FAILED', 'CANCELLED')")
    Optional<Delivery> findActiveByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT d FROM Delivery d WHERE " +
           "(:customerId IS NULL OR d.customer.id = :customerId) AND " +
           "(:branchId IS NULL OR d.order.branchId = :branchId) AND " +
           "(:driverId IS NULL OR (d.driver IS NOT NULL AND d.driver.id = :driverId)) AND " +
           "(:status IS NULL OR d.deliveryStatus = :status) AND " +
           "(:date IS NULL OR d.deliveryDate = :date) AND " +
           "(:search IS NULL OR :search = '' OR (" +
           "   LOWER(d.customer.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "   LOWER(d.deliveryAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "   CONCAT('', d.order.id) LIKE CONCAT('%', :search, '%') OR " +
           "   CONCAT('', d.id) LIKE CONCAT('%', :search, '%') OR " +
           "   (d.driver IS NOT NULL AND LOWER(d.driver.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')))" +
           "))")
    Page<Delivery> filterDeliveries(
            @Param("customerId") Long customerId,
            @Param("branchId") Long branchId,
            @Param("driverId") Long driverId,
            @Param("status") DeliveryStatus status,
            @Param("date") LocalDate date,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(d) FROM Delivery d WHERE d.deliveryStatus IN ('PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY')")
    long countPendingDeliveries();

    @Query("SELECT COUNT(d) FROM Delivery d WHERE d.deliveryDate = :today")
    long countTodayDeliveries(@Param("today") LocalDate today);
}
