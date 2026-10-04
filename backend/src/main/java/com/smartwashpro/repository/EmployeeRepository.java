package com.smartwashpro.repository;

import com.smartwashpro.model.Employee;
import com.smartwashpro.model.enums.EmploymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query("SELECT e FROM Employee e JOIN e.user u WHERE " +
           "(:branchId IS NULL OR e.branchId = :branchId) AND " +
           "(:status IS NULL OR e.employmentStatus = :status) AND " +
           "(:role IS NULL OR :role = '' OR " +
           " e.role = :role OR " +
           " (:role = 'MANAGER' AND e.role IN ('MANAGER', 'BRANCH_MANAGER')) OR " +
           " (:role = 'BRANCH_MANAGER' AND e.role IN ('MANAGER', 'BRANCH_MANAGER')) OR " +
           " (:role = 'DRIVER' AND e.role IN ('DRIVER', 'DELIVERY_DRIVER')) OR " +
           " (:role = 'DELIVERY_DRIVER' AND e.role IN ('DRIVER', 'DELIVERY_DRIVER'))) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " u.phoneNumber LIKE CONCAT('%', :search, '%'))")
    Page<Employee> filterEmployees(
            @Param("branchId") Long branchId,
            @Param("status") EmploymentStatus status,
            @Param("role") String role,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT e FROM Employee e JOIN e.user u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<Employee> searchEmployees(@Param("q") String query, Pageable pageable);
    
    @Query("SELECT e FROM Employee e JOIN e.user u WHERE e.branchId = :branchId AND LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<Employee> searchEmployeesByBranch(@Param("branchId") Long branchId, @Param("q") String query, Pageable pageable);

    Optional<Employee> findByUserId(Long userId);
    Page<Employee> findAll(Pageable pageable);
    Page<Employee> findByBranchId(Long branchId, Pageable pageable);
    List<Employee> findByBranchId(Long branchId);
    List<Employee> findByRole(String role);
    List<Employee> findByRoleAndBranchId(String role, Long branchId);
    List<Employee> findByRoleInAndBranchIdAndEmploymentStatus(Collection<String> roles, Long branchId, EmploymentStatus status);
    List<Employee> findByRoleInAndEmploymentStatus(Collection<String> roles, EmploymentStatus status);
    long countByBranchId(Long branchId);
    long countByEmploymentStatus(EmploymentStatus status);
}

