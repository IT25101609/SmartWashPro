package com.smartwashpro.repository;

import com.smartwashpro.model.EmployeeTask;
import com.smartwashpro.model.enums.TaskPriority;
import com.smartwashpro.model.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeTaskRepository extends JpaRepository<EmployeeTask, Long> {
    Page<EmployeeTask> findByEmployeeId(Long employeeId, Pageable pageable);
    List<EmployeeTask> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    long countByEmployeeId(Long employeeId);
    long countByEmployeeIdAndTaskStatus(Long employeeId, TaskStatus status);

    @Query("SELECT t FROM EmployeeTask t " +
           "JOIN t.employee e " +
           "JOIN e.user u " +
           "WHERE (:branchId IS NULL OR e.branchId = :branchId) " +
           "AND (:employeeId IS NULL OR e.id = :employeeId) " +
           "AND (:status IS NULL OR t.taskStatus = :status) " +
           "AND (:priority IS NULL OR t.priority = :priority) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(t.taskDescription) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<EmployeeTask> filterTasks(
            @Param("branchId") Long branchId,
            @Param("employeeId") Long employeeId,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("search") String search,
            Pageable pageable);
}
