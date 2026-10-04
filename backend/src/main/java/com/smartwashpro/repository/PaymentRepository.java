package com.smartwashpro.repository;

import com.smartwashpro.model.Payment;
import com.smartwashpro.model.enums.PaymentMethod;
import com.smartwashpro.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);
    Page<Payment> findByCustomerId(Long customerId, Pageable pageable);
    long countByPaymentStatus(PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE " +
           "(:customerId IS NULL OR p.customer.id = :customerId) AND " +
           "(:status IS NULL OR p.paymentStatus = :status) AND " +
           "(:method IS NULL OR p.paymentMethod = :method) AND " +
           "(:branchId IS NULL OR p.order.branchId = :branchId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(p.receiptNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " CONCAT(p.order.id, '') LIKE CONCAT('%', :search, '%') OR " +
           " LOWER(p.customer.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.transactionReference) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Payment> filterPayments(
            @Param("customerId") Long customerId,
            @Param("status") PaymentStatus status,
            @Param("method") PaymentMethod method,
            @Param("branchId") Long branchId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = 'PAID'")
    Double getTotalRevenue();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = 'PAID' AND p.paymentDate >= :since")
    Double getRevenueFrom(@Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = 'PAID' AND (p.paymentDate BETWEEN :start AND :end OR (p.paymentDate IS NULL AND p.createdAt BETWEEN :start AND :end))")
    Double getRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = 'PENDING'")
    Double getPendingPaymentsAmount();

    @Query("SELECT p.paymentMethod as method, SUM(p.amount) as amount FROM Payment p WHERE p.paymentStatus = 'PAID' GROUP BY p.paymentMethod")
    List<Map<String, Object>> getRevenueByPaymentMethod();
}
