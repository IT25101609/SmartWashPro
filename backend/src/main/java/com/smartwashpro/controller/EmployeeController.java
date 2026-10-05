package com.smartwashpro.controller;

// DTO used to receive employee data from the frontend
import com.smartwashpro.dto.request.EmployeeRequest;

// DTOs used to send employee-related responses
import com.smartwashpro.dto.response.AttendanceResponse;
import com.smartwashpro.dto.response.EmployeeResponse;
import com.smartwashpro.dto.response.TaskResponse;

// Enum representing employee employment status
import com.smartwashpro.model.enums.EmploymentStatus;

// Service layer containing employee business logic
import com.smartwashpro.service.EmployeeService;

// Used to validate the request body
import jakarta.validation.Valid;

// Spring Data pagination
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

// HTTP response status
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

// Security authorization
import org.springframework.security.access.prepost.PreAuthorize;

// Spring MVC annotations
import org.springframework.web.bind.annotation.*;

// Used for receiving key-value data in assignBranch()
import java.util.Map;


// Marks this class as a REST API controller
@RestController

// Base URL for all employee-related APIs
@RequestMapping("/api/employees")

// Only ADMIN and BRANCH_MANAGER_ADMIN users can access
// all endpoints in this controller
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class EmployeeController {

    // Service used to handle employee business logic
    private final EmployeeService employeeService;


    // Constructor injection
    // EmployeeService is provided by Spring
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }


    // =========================================================
    // GET ALL EMPLOYEES
    // =========================================================

    // Handles GET /api/employees
    @GetMapping
    public ResponseEntity<Page<EmployeeResponse>> getAll(

            // Optional search text
            @RequestParam(required = false) String search,

            // Optional branch filter
            @RequestParam(required = false) Long branchId,

            // Optional employee role filter
            @RequestParam(required = false) String role,

            // Optional employment status filter
            @RequestParam(required = false) EmploymentStatus status,

            // Pagination and sorting
            // Default: 20 employees per page
            // Sorted by createdAt in descending order
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable) {

        // Call service layer to get employees
        return ResponseEntity.ok(
                employeeService.getAllEmployees(
                        search,
                        branchId,
                        role,
                        status,
                        pageable
                )
        );
    }


    // =========================================================
    // GET EMPLOYEE BY ID
    // =========================================================

    // Handles GET /api/employees/{id}
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getById(
            @PathVariable Long id) {

        // Get employee using the given ID
        return ResponseEntity.ok(
                employeeService.getEmployeeById(id)
        );
    }


    // =========================================================
    // CREATE EMPLOYEE
    // =========================================================

    // Handles POST /api/employees
    @PostMapping
    public ResponseEntity<EmployeeResponse> create(

            // @Valid checks the validation rules
            // defined in EmployeeRequest
            @Valid @RequestBody EmployeeRequest request) {

        // Create a new employee
        // Returns HTTP 201 CREATED
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        employeeService.createEmployee(request)
                );
    }


    // =========================================================
    // UPDATE EMPLOYEE
    // =========================================================

    // Handles PUT /api/employees/{id}
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> update(

            // ID of employee to update
            @PathVariable Long id,

            // Updated employee information
            @RequestBody EmployeeRequest request) {

        // Update employee using the service layer
        return ResponseEntity.ok(
                employeeService.updateEmployee(id, request)
        );
    }


    // =========================================================
    // ASSIGN BRANCH
    // =========================================================

    // Handles PUT /api/employees/{id}/branch
    @PutMapping("/{id}/branch")
    public ResponseEntity<EmployeeResponse> assignBranch(

            // Employee ID
            @PathVariable Long id,

            // Receives branch information as key-value pairs
            @RequestBody Map<String, Object> body) {

        // Initially no branch is assigned
        Long branchId = null;

        // Check whether branchId exists in the request
        // and is not null
        if (body.containsKey("branchId") && body.get("branchId") != null) {

            // Convert branchId value into Long
            branchId = Long.valueOf(
                    body.get("branchId").toString()
            );
        }

        // Assign the branch to the employee
        return ResponseEntity.ok(
                employeeService.assignBranch(id, branchId)
        );
    }


    // =========================================================
    // ACTIVATE EMPLOYEE
    // =========================================================

    // Handles PUT /api/employees/{id}/activate
    @PutMapping("/{id}/activate")
    public ResponseEntity<EmployeeResponse> activate(
            @PathVariable Long id) {

        // Change employee status to active
        return ResponseEntity.ok(
                employeeService.activateEmployee(id)
        );
    }


    // =========================================================
    // DEACTIVATE EMPLOYEE
    // =========================================================

    // Handles PUT /api/employees/{id}/deactivate
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<EmployeeResponse> deactivate(
            @PathVariable Long id) {

        // Change employee status to inactive
        return ResponseEntity.ok(
                employeeService.deactivateEmployee(id)
        );
    }


    // =========================================================
    // TOGGLE EMPLOYEE STATUS
    // =========================================================

    // Handles PUT /api/employees/{id}/toggle-status
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<EmployeeResponse> toggleStatus(
            @PathVariable Long id) {

        // Switch employee status
        // Active -> Inactive
        // Inactive -> Active
        return ResponseEntity.ok(
                employeeService.toggleStatus(id)
        );
    }


    // =========================================================
    // DELETE EMPLOYEE
    // =========================================================

    // Handles DELETE /api/employees/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        // Instead of permanently deleting the employee,
        // the employee is deactivated
        employeeService.deactivateEmployee(id);

        // Return HTTP 204 No Content
        return ResponseEntity.noContent().build();
    }


    // =========================================================
    // GET EMPLOYEE TASKS
    // =========================================================

    // Handles GET /api/employees/{id}/tasks
    @GetMapping("/{id}/tasks")
    public ResponseEntity<Page<TaskResponse>> getAssignedTasks(

            // Employee ID
            @PathVariable Long id,

            // Pagination and sorting
            // Default: 20 tasks per page
            // Newest assigned date first
            @PageableDefault(
                    size = 20,
                    sort = "assignedDate",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable) {

        // Get tasks assigned to the employee
        return ResponseEntity.ok(
                employeeService.getEmployeeTasks(
                        id,
                        pageable
                )
        );
    }


    // =========================================================
    // GET EMPLOYEE ATTENDANCE
    // =========================================================

    // Handles GET /api/employees/{id}/attendance
    @GetMapping("/{id}/attendance")
    public ResponseEntity<Page<AttendanceResponse>> getAttendance(

            // Employee ID
            @PathVariable Long id,

            // Pagination and sorting
            // Default: 50 attendance records per page
            // Newest date first
            @PageableDefault(
                    size = 50,
                    sort = "date",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable) {

        // Get attendance records belonging to the employee
        return ResponseEntity.ok(
                employeeService.getEmployeeAttendance(
                        id,
                        pageable
                )
        );
    }
}
