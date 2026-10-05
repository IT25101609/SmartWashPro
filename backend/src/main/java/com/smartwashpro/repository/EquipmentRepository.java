package com.smartwashpro.repository;

import com.smartwashpro.model.Equipment;
import com.smartwashpro.model.enums.EquipmentStatus;
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
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByStatus(EquipmentStatus status);
    List<Equipment> findByNextMaintenanceDateBefore(LocalDate date);
    long countByStatus(EquipmentStatus status);
    Page<Equipment> findByBranchId(Long branchId, Pageable pageable);
    List<Equipment> findByBranchId(Long branchId);
    boolean existsBySerialNumber(String serialNumber);
    Optional<Equipment> findBySerialNumber(String serialNumber);

    @Query("SELECT e FROM Equipment e WHERE " +
           "(:branchId IS NULL OR e.branchId = :branchId) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:equipmentType IS NULL OR :equipmentType = '' OR LOWER(e.equipmentType) = LOWER(:equipmentType)) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(e.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(e.model) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(e.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(e.equipmentType) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Equipment> filterEquipment(
            @Param("branchId") Long branchId,
            @Param("status") EquipmentStatus status,
            @Param("equipmentType") String equipmentType,
            @Param("search") String search,
            Pageable pageable);
}
