package com.smartwashpro.repository;

import com.smartwashpro.model.Maintenance;
import com.smartwashpro.model.enums.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    List<Maintenance> findByEquipmentIdOrderByScheduledDateDesc(Long equipmentId);

    Page<Maintenance> findByEquipmentId(Long equipmentId, Pageable pageable);

    List<Maintenance> findByStatus(MaintenanceStatus status);

    List<Maintenance> findByScheduledDateGreaterThanEqualAndStatusInOrderByScheduledDateAsc(
            LocalDate date, List<MaintenanceStatus> statuses);

    @Query("SELECT m FROM Maintenance m " +
           "WHERE (:branchId IS NULL OR m.equipment.branchId = :branchId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:equipmentId IS NULL OR m.equipment.id = :equipmentId) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(m.equipment.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.equipment.serialNumber, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.maintenanceType, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.performedBy, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.problem, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Maintenance> filterMaintenance(
            @Param("branchId") Long branchId,
            @Param("status") MaintenanceStatus status,
            @Param("equipmentId") Long equipmentId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT m FROM Maintenance m " +
           "WHERE (:branchId IS NULL OR m.equipment.branchId = :branchId) " +
           "AND m.status IN (com.smartwashpro.model.enums.MaintenanceStatus.SCHEDULED, com.smartwashpro.model.enums.MaintenanceStatus.IN_PROGRESS) " +
           "ORDER BY m.scheduledDate ASC")
    List<Maintenance> findUpcomingMaintenance(@Param("branchId") Long branchId);

    @Query("SELECT m FROM Maintenance m " +
           "WHERE (:branchId IS NULL OR m.equipment.branchId = :branchId) " +
           "AND m.status IN (com.smartwashpro.model.enums.MaintenanceStatus.COMPLETED, com.smartwashpro.model.enums.MaintenanceStatus.CANCELLED) " +
           "ORDER BY COALESCE(m.completedDate, m.scheduledDate) DESC")
    List<Maintenance> findMaintenanceHistory(@Param("branchId") Long branchId);
}
