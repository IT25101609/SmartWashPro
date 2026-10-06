package com.smartwashpro.repository;

// Employee entity used by this repository
import com.smartwashpro.model.Employee;

// Enum for employee employment status
import com.smartwashpro.model.enums.EmploymentStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Used to write custom JPQL queries
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;


// Marks this interface as a Spring Data repository
@Repository

// JpaRepository provides built-in CRUD operations
// Employee = entity type, Long = primary key type
public interface EmployeeRepository
        extends JpaRepository<Employee, Long> {


    // based on branch, employment status, role and search text
    @Query("SELECT e FROM Employee e JOIN e.user u WHERE " +

           // Filter by branch if branchId is provided
           "(:branchId IS NULL OR e.branchId = :branchId) AND " +

           // Filter by employment status if provided
           "(:status IS NULL OR e.employmentStatus = :status) AND " +

           // Filter employees by their role
           "(:role IS NULL OR :role = '' OR " +

           " e.role = :role OR " +

           // MANAGER also includes BRANCH_MANAGER
           " (:role = 'MANAGER' AND e.role IN ('MANAGER', 'BRANCH_MANAGER')) OR " +

           " (:role = 'BRANCH_MANAGER' AND e.role IN ('MANAGER', 'BRANCH_MANAGER')) OR " +

           // DRIVER also includes DELIVERY_DRIVER
           " (:role = 'DRIVER' AND e.role IN ('DRIVER', 'DELIVERY_DRIVER')) OR " +

           " (:role = 'DELIVERY_DRIVER' AND e.role IN ('DRIVER', 'DELIVERY_DRIVER'))) AND " +

           // Search by employee name, email or phone number
           "(:search IS NULL OR :search = '' OR " +

           " LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +

           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +

           " u.phoneNumber LIKE CONCAT('%', :search, '%'))")


    // Returns filtered employees with pagination
    Page<Employee> filterEmployees(

            // Branch filter
            @Param("branchId")
            Long branchId,

            // Employment status filter
            @Param("status")
            EmploymentStatus status,

            // Role filter
            @Param("role")
            String role,

            // Search text
            @Param("search")
            String search,

            // Controls pagination
            Pageable pageable
    );


    // Searches employees by their full name
    // Search is case-insensitive
    @Query("SELECT e FROM Employee e JOIN e.user u " +
           "WHERE LOWER(u.fullName) LIKE " +
           "LOWER(CONCAT('%',:q,'%'))")

    Page<Employee> searchEmployees(
            @Param("q") String query,
            Pageable pageable
    );


    // Searches employees by name within a specific branch
    @Query("SELECT e FROM Employee e JOIN e.user u " +
           "WHERE e.branchId = :branchId " +
           "AND LOWER(u.fullName) LIKE " +
           "LOWER(CONCAT('%',:q,'%'))")

    Page<Employee> searchEmployeesByBranch(
            @Param("branchId")
            Long branchId,

            @Param("q")
            String query,

            Pageable pageable
    );


    // Finds an employee using their User ID
    // Optional is used because the employee may not exist
    Optional<Employee> findByUserId(Long userId);


    // Returns all employees with pagination
    Page<Employee> findAll(Pageable pageable);


    // Finds employees belonging to a specific branch
    // with pagination
    Page<Employee> findByBranchId(
            Long branchId,
            Pageable pageable
    );


    // Finds all employees in a specific branch
    // without pagination
    List<Employee> findByBranchId(Long branchId);


    // Finds employees with a specific role
    List<Employee> findByRole(String role);


    // Finds employees with a specific role
    // who also belong to a specific branch
    List<Employee> findByRoleAndBranchId(
            String role,
            Long branchId
    );


    // Finds employees whose role is included in a collection
    // and who belong to a specific branch and have a specific status
    List<Employee> findByRoleInAndBranchIdAndEmploymentStatus(
            Collection<String> roles,
            Long branchId,
            EmploymentStatus status
    );


    List<Employee> findByRoleInAndEmploymentStatus(
            Collection<String> roles,
            EmploymentStatus status
    );


    // Counts the number of employees in a specific branch
    long countByBranchId(Long branchId);


    long countByEmploymentStatus(
            EmploymentStatus status
    );
}
