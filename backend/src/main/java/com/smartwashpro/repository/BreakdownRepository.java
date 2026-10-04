package com.smartwashpro.repository;

import com.smartwashpro.model.Breakdown;
import com.smartwashpro.model.enums.BreakdownStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BreakdownRepository extends JpaRepository<Breakdown, Long> {
    List<Breakdown> findByEquipmentId(Long equipmentId);

    List<Breakdown> findByEquipmentIdOrderByReportedDateDesc(Long equipmentId);

    Page<Breakdown> findByEquipmentId(Long equipmentId, Pageable pageable);

    List<Breakdown> findByStatus(BreakdownStatus status);

    @Query("SELECT b FROM Breakdown b " +
           "WHERE (:branchId IS NULL OR b.equipment.branchId = :branchId) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:equipmentId IS NULL OR b.equipment.id = :equipmentId) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(b.equipment.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(b.equipment.serialNumber, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(b.description, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(b.technician, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(b.repairNotes, '')) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Breakdown> filterBreakdowns(
            @Param("branchId") Long branchId,
            @Param("status") BreakdownStatus status,
            @Param("equipmentId") Long equipmentId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT b FROM Breakdown b " +
           "WHERE (:branchId IS NULL OR b.equipment.branchId = :branchId) " +
           "AND b.status IN (com.smartwashpro.model.enums.BreakdownStatus.REPORTED, com.smartwashpro.model.enums.BreakdownStatus.IN_PROGRESS, com.smartwashpro.model.enums.BreakdownStatus.IN_REPAIR) " +
           "ORDER BY b.reportedDate DESC")
    List<Breakdown> findActiveBreakdowns(@Param("branchId") Long branchId);

    @Query("SELECT b FROM Breakdown b " +
           "WHERE (:branchId IS NULL OR b.equipment.branchId = :branchId) " +
           "AND b.status IN (com.smartwashpro.model.enums.BreakdownStatus.REPAIRED, com.smartwashpro.model.enums.BreakdownStatus.CLOSED, com.smartwashpro.model.enums.BreakdownStatus.SCRAPPED) " +
           "ORDER BY COALESCE(b.repairedDate, b.reportedDate) DESC")
    List<Breakdown> findResolvedBreakdowns(@Param("branchId") Long branchId);
}
