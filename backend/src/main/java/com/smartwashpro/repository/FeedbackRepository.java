package com.smartwashpro.repository;

import com.smartwashpro.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    @Query("SELECT e FROM Employee e JOIN e.user u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<Employee> searchEmployees(@Param("q") String query, Pageable pageable);
    
    @Query("SELECT e FROM Employee e JOIN e.user u WHERE e.branchId = :branchId AND LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<Employee> searchEmployeesByBranch(@Param("branchId") Long branchId, @Param("q") String query, Pageable pageable);

    Optional<Employee> findByUserId(Long userId);
    Page<Employee> findAll(Pageable pageable);
    Page<Employee> findByBranchId(Long branchId, Pageable pageable);
}
