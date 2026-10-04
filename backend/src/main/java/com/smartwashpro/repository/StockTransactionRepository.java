package com.smartwashpro.repository;

import com.smartwashpro.model.StockTransaction;
import com.smartwashpro.model.enums.StockTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    Page<StockTransaction> findByInventoryIdOrderByCreatedAtDesc(Long inventoryId, Pageable pageable);
    List<StockTransaction> findByInventoryIdOrderByCreatedAtDesc(Long inventoryId);

    @Query("SELECT st FROM StockTransaction st JOIN st.inventory i LEFT JOIN st.createdBy u WHERE " +
           "(:inventoryId IS NULL OR i.id = :inventoryId) AND " +
           "(:branchId IS NULL OR i.branchId = :branchId) AND " +
           "(:transactionType IS NULL OR st.transactionType = :transactionType) AND " +
           "(:startDate IS NULL OR st.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR st.createdAt <= :endDate) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(i.itemName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(st.notes) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " (u IS NOT NULL AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))) " +
           "ORDER BY st.createdAt DESC")
    Page<StockTransaction> filterTransactions(
            @Param("inventoryId") Long inventoryId,
            @Param("branchId") Long branchId,
            @Param("transactionType") StockTransactionType transactionType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            Pageable pageable);
}
