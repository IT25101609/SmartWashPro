package com.smartwashpro.repository;

import com.smartwashpro.model.Order;
import com.smartwashpro.model.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    Page<Order> findByCustomerId(Long customerId, Pageable pageable);
    List<Order> findByCustomerIdAndOrderStatus(Long customerId, OrderStatus status);
    List<Order> findByOrderStatus(OrderStatus status);
    Page<Order> findByOrderStatus(OrderStatus status, Pageable pageable);
    Page<Order> findByBranchId(Long branchId, Pageable pageable);
    long countByOrderStatus(OrderStatus status);
    long countByBranchId(Long branchId);
    long countByBranchIdAndOrderStatus(Long branchId, OrderStatus status);
    
    @Query("SELECT o FROM Order o WHERE o.customer.id = :customerId ORDER BY o.createdAt DESC")
    List<Order> findRecentByCustomerId(Long customerId, Pageable pageable);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :from AND o.createdAt <= :to")
    long countByDateRange(LocalDateTime from, LocalDateTime to);
    long countByOrderDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE (o.orderDate BETWEEN :start AND :end) OR (o.orderDate IS NULL AND o.createdAt BETWEEN :start AND :end)")
    long countOrdersBetween(@org.springframework.data.repository.query.Param("start") LocalDateTime start, @org.springframework.data.repository.query.Param("end") LocalDateTime end);
    
    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.orderStatus = 'DELIVERED'")
    Double getTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.branchId = :branchId AND o.orderStatus = 'DELIVERED'")
    Double getTotalRevenueByBranch(Long branchId);
    
    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.orderStatus = 'DELIVERED' AND o.createdAt >= :from")
    Double getRevenueFrom(LocalDateTime from);
    
    @Query("SELECT MONTH(o.createdAt) as month, COUNT(o) as count, COALESCE(SUM(o.totalPrice), 0) as revenue " +
           "FROM Order o WHERE YEAR(o.createdAt) = :year GROUP BY MONTH(o.createdAt) ORDER BY MONTH(o.createdAt)")
    List<Object[]> getMonthlyStats(int year);
    
    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o GROUP BY o.orderStatus")
    List<Object[]> getOrderStatusDistribution();

    @Query("SELECT o FROM Order o WHERE " +
           "(:branchId IS NULL OR o.branchId = :branchId) AND " +
           "(:status IS NULL OR o.orderStatus = :status) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(o.customer.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(o.customer.user.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " o.customer.user.phoneNumber LIKE CONCAT('%', :search, '%') OR " +
           " CONCAT('', o.id) LIKE CONCAT('%', :search, '%'))")
    Page<Order> filterOrders(
            @org.springframework.data.repository.query.Param("branchId") Long branchId,
            @org.springframework.data.repository.query.Param("status") OrderStatus status,
            @org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") LocalDateTime endDate,
            @org.springframework.data.repository.query.Param("search") String search,
            Pageable pageable);
}
