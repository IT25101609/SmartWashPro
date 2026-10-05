package com.smartwashpro.repository;

// EmployeeTask entity managed by this repository
import com.smartwashpro.model.EmployeeTask;

// Enums used for task priority and status
import com.smartwashpro.model.enums.TaskPriority;
import com.smartwashpro.model.enums.TaskStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Used for custom JPQL queries
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.util.List;


// Marks this interface as a Spring Data repository
@Repository

// JpaRepository provides built-in CRUD operations
// EmployeeTask = entity type, Long = primary key type
public interface EmployeeTaskRepository
        extends JpaRepository<EmployeeTask, Long> {


    // Gets all tasks assigned to a specific employee
    // Pageable allows pagination
    Page<EmployeeTask> findByEmployeeId(
            Long employeeId,
            Pageable pageable
    );


    // Gets an employee's tasks and sorts them
    // from newest to oldest using createdAt
    List<EmployeeTask> findByEmployeeIdOrderByCreatedAtDesc(
            Long employeeId
    );


    // Counts the total number of tasks assigned to an employee
    long countByEmployeeId(Long employeeId);


    // Counts tasks for an employee with a specific status
    // Example: number of PENDING tasks
    long countByEmployeeIdAndTaskStatus(
            Long employeeId,
            TaskStatus status
    );


    // Custom query used to filter tasks
    // by branch, employee, status, priority and search text
    @Query("SELECT t FROM EmployeeTask t " +

           // Join task with the related employee
           "JOIN t.employee e " +

           // Join employee with the related user
           // This allows us to search by user's name
           "JOIN e.user u " +

           // Filter by branch if branchId is provided
           "WHERE (:branchId IS NULL OR e.branchId = :branchId) " +

           // Filter by employee if employeeId is provided
           "AND (:employeeId IS NULL OR e.id = :employeeId) " +

           // Filter by task status if status is provided
           "AND (:status IS NULL OR t.taskStatus = :status) " +

           // Filter by task priority if priority is provided
           "AND (:priority IS NULL OR t.priority = :priority) " +

           // Search by task description or employee name
           "AND (:search IS NULL OR :search = '' OR " +

           // Search inside the task description
           "     LOWER(t.taskDescription) LIKE " +
           "LOWER(CONCAT('%', :search, '%')) OR " +

           // Search by employee's full name
           "     LOWER(u.fullName) LIKE " +
           "LOWER(CONCAT('%', :search, '%')))")

    
    // Executes the custom filtering query
    Page<EmployeeTask> filterTasks(

            // Branch filter
            @Param("branchId")
            Long branchId,

            // Employee filter
            @Param("employeeId")
            Long employeeId,

            // Task status filter
            @Param("status")
            TaskStatus status,

            // Task priority filter
            @Param("priority")
            TaskPriority priority,

            // Search text
            @Param("search")
            String search,

            // Controls pagination
            Pageable pageable
    );
}
