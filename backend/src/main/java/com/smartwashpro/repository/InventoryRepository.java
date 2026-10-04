package com.smartwashpro.repository;

import com.smartwashpro.model.Inventory;
import com.smartwashpro.model.enums.InventoryCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    @Query("SELECT i FROM Inventory i WHERE LOWER(i.itemName) LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<Inventory> searchByName(@Param("q") String query, Pageable pageable);
    
    @Query("SELECT i FROM Inventory i WHERE i.quantity > 0 AND i.quantity < i.minimumStockLevel")
    List<Inventory> findLowStockItems();

    @Query("SELECT i FROM Inventory i WHERE i.quantity <= 0")
    List<Inventory> findOutOfStockItems();

    Page<Inventory> findByBranchId(Long branchId, Pageable pageable);
    List<Inventory> findByBranchId(Long branchId);
    List<Inventory> findBySupplierId(Long supplierId);
    long countBySupplierId(Long supplierId);

    @Query("SELECT i FROM Inventory i LEFT JOIN i.supplier s WHERE " +
           "(:branchId IS NULL OR i.branchId = :branchId) AND " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:isActive IS NULL OR i.isActive = :isActive) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(i.itemName) LIKE LOWER(CONCAT('%', :search, '%')) OR (s IS NOT NULL AND LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :search, '%')))) AND " +
           "(:statusFilter IS NULL OR :statusFilter = '' OR :statusFilter = 'ALL' OR " +
           " (:statusFilter = 'OUT_OF_STOCK' AND (i.quantity IS NULL OR i.quantity <= 0.0)) OR " +
           " (:statusFilter = 'LOW_STOCK' AND i.quantity > 0.0 AND i.quantity < i.minimumStockLevel) OR " +
           " (:statusFilter = 'IN_STOCK' AND i.quantity >= i.minimumStockLevel))")
    Page<Inventory> filterInventory(
            @Param("branchId") Long branchId,
            @Param("category") InventoryCategory category,
            @Param("isActive") Boolean isActive,
            @Param("search") String search,
            @Param("statusFilter") String statusFilter,
            Pageable pageable);
}
