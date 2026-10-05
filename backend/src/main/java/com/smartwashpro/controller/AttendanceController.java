package com.smartwashpro.controller;

// Import request and response DTOs
import com.smartwashpro.dto.request.AttendanceRequest;
import com.smartwashpro.dto.response.AttendanceResponse;

// Import User model and attendance status enum
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.AttendanceStatus;

// Import repository and service classes
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.service.AttendanceService;

// Spring Data pagination imports
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

// Date and time formatting
import org.springframework.format.annotation.DateTimeFormat;

// HTTP response status
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

// Spring Security annotations
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

// Spring MVC annotations
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;


// Marks this class as a REST API controller
@RestController

// Base URL for all attendance-related endpoints
@RequestMapping("/api/attendance")
public class AttendanceController {

    // Service used to handle attendance business logic
    private final AttendanceService attendanceService;

    // Repository used to find the currently logged-in user
    private final UserRepository userRepository;


    // Constructor injection for required dependencies
    public AttendanceController(AttendanceService attendanceService,
                                UserRepository userRepository) {
        this.attendanceService = attendanceService;
        this.userRepository = userRepository;
    }


    // Gets the User object of the currently logged-in user
    private User getCurrentUser(UserDetails userDetails) {

        // If no user is authenticated, return null
        if (userDetails == null) return null;

        // UserDetails username contains the user's email
        // Find the user using that email
        return userRepository.findByEmail(userDetails.getUsername())
                .orElse(null);
    }


    // =========================================================
    // GET ALL ATTENDANCE RECORDS
    // =========================================================

    // Handles GET /api/attendance
    @GetMapping

    // Only ADMIN, BRANCH_MANAGER_ADMIN and RECEPTIONIST can access
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<Page<AttendanceResponse>> getAll(

            // Optional filter by branch
            @RequestParam(required = false) Long branchId,

            // Optional filter by employee
            @RequestParam(required = false) Long employeeId,

            // Optional filter by a specific date
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,

            // Optional starting date for date range
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            // Optional ending date for date range
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            // Optional attendance status filter
            @RequestParam(required = false) AttendanceStatus status,

            // Optional search text
            @RequestParam(required = false) String search,

            // Pagination settings
            // Default: 50 records per page, newest date first
            @PageableDefault(
                    size = 50,
                    sort = "date",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable) {

        // Call the service to retrieve filtered attendance records
        return ResponseEntity.ok(
                attendanceService.getAttendance(
                        branchId,
                        employeeId,
                        date,
                        startDate,
                        endDate,
                        status,
                        search,
                        pageable
                )
        );
    }


    // =========================================================
    // GET TODAY'S ATTENDANCE
    // =========================================================

    // Handles GET /api/attendance/today
    @GetMapping("/today")

    // Only authorized staff can view today's attendance
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<Page<AttendanceResponse>> getToday(

            // Optional branch filter
            @RequestParam(required = false) Long branchId,

            // Pagination settings
            @PageableDefault(size = 50)
            Pageable pageable) {

        // Get attendance records for today's date
        return ResponseEntity.ok(
                attendanceService.getAttendance(
                        branchId,
                        null,
                        LocalDate.now(),
                        null,
                        null,
                        null,
                        null,
                        pageable
                )
        );
    }


    // =========================================================
    // GET ATTENDANCE BY ID
    // =========================================================

    // Handles GET /api/attendance/{id}
    @GetMapping("/{id}")

    // Only authorized staff can view attendance details
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<AttendanceResponse> getById(
            @PathVariable Long id) {

        // Find attendance record using its ID
        return ResponseEntity.ok(
                attendanceService.getAttendanceById(id)
        );
    }


    // =========================================================
    // CHECK-IN
    // =========================================================

    // Handles POST /api/attendance/check-in
    @PostMapping("/check-in")

    // Any authenticated user can perform check-in
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AttendanceResponse> checkIn(

            // Attendance data can be sent in the request body
            @RequestBody(required = false)
            AttendanceRequest request,

            // Employee ID can also be provided as a request parameter
            @RequestParam(required = false)
            Long employeeId,

            // Optional attendance date
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,

            // Optional check-in time
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime time,

            // Gets details of the currently authenticated user
            @AuthenticationPrincipal
            UserDetails userDetails) {

        // Get the currently logged-in User object
        User currentUser = getCurrentUser(userDetails);

        // Get employee ID from request body if available,
        // otherwise use the request parameter
        Long targetEmpId =
                request != null && request.getEmployeeId() != null
                        ? request.getEmployeeId()
                        : employeeId;

        // Get date from request body if available,
        // otherwise use the request parameter
        LocalDate targetDate =
                request != null && request.getDate() != null
                        ? request.getDate()
                        : date;

        // Get check-in time from request body.
        // If time is not available, check checkIn field,
        // otherwise use the request parameter.
        LocalTime targetTime =
                request != null && request.getTime() != null
                        ? request.getTime()
                        : (request != null && request.getCheckIn() != null
                                ? request.getCheckIn()
                                : time);

        // Send the check-in information to the service layer
        return ResponseEntity.ok(
                attendanceService.checkIn(
                        targetEmpId,
                        targetDate,
                        targetTime,
                        currentUser
                )
        );
    }


    // =========================================================
    // CHECK-OUT
    // =========================================================

    // Handles POST /api/attendance/check-out
    @PostMapping("/check-out")

    // Any authenticated user can perform check-out
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AttendanceResponse> checkOut(

            // Attendance data from request body
            @RequestBody(required = false)
            AttendanceRequest request,

            // Optional employee ID
            @RequestParam(required = false)
            Long employeeId,

            // Optional date
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,

            // Optional check-out time
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime time,

            // Currently authenticated user
            @AuthenticationPrincipal
            UserDetails userDetails) {

        // Get the currently logged-in user
        User currentUser = getCurrentUser(userDetails);

        // Get employee ID from request body or parameter
        Long targetEmpId =
                request != null && request.getEmployeeId() != null
                        ? request.getEmployeeId()
                        : employeeId;

        // Get date from request body or parameter
        LocalDate targetDate =
                request != null && request.getDate() != null
                        ? request.getDate()
                        : date;

        // Get check-out time from request body.
        // If unavailable, use checkOut field or request parameter.
        LocalTime targetTime =
                request != null && request.getTime() != null
                        ? request.getTime()
                        : (request != null && request.getCheckOut() != null
                                ? request.getCheckOut()
                                : time);

        // Send check-out information to the service layer
        return ResponseEntity.ok(
                attendanceService.checkOut(
                        targetEmpId,
                        targetDate,
                        targetTime,
                        currentUser
                )
        );
    }


    // =========================================================
    // CREATE ATTENDANCE
    // =========================================================

    // Handles POST /api/attendance
    @PostMapping

    // Only ADMIN and BRANCH_MANAGER_ADMIN can manually create records
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<AttendanceResponse> create(

            // Attendance information received from frontend
            @RequestBody AttendanceRequest request,

            // Currently logged-in user
            @AuthenticationPrincipal
            UserDetails userDetails) {

        // Get current logged-in user
        User currentUser = getCurrentUser(userDetails);

        // Create a new attendance record
        // HTTP 201 CREATED is returned
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        attendanceService.recordAttendance(
                                request,
                                currentUser
                        )
                );
    }


    // =========================================================
    // UPDATE ATTENDANCE
    // =========================================================

    // Handles PUT /api/attendance/{id}
    @PutMapping("/{id}")

    // Only ADMIN and BRANCH_MANAGER_ADMIN can update
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<AttendanceResponse> update(

            // ID of the attendance record to update
            @PathVariable Long id,

            // Updated attendance information
            @RequestBody AttendanceRequest request,

            // Currently logged-in user
            @AuthenticationPrincipal
            UserDetails userDetails) {

        // Get current user
        User currentUser = getCurrentUser(userDetails);

        // Update the attendance record
        return ResponseEntity.ok(
                attendanceService.updateAttendance(
                        id,
                        request,
                        currentUser
                )
        );
    }


    // =========================================================
    // DELETE ATTENDANCE
    // =========================================================

    // Handles DELETE /api/attendance/{id}
    @DeleteMapping("/{id}")

    // Only ADMIN and BRANCH_MANAGER_ADMIN can delete
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<Void> delete(

            // ID of the attendance record to delete
            @PathVariable Long id,

            // Currently logged-in user
            @AuthenticationPrincipal
            UserDetails userDetails) {

        // Get current logged-in user
        User currentUser = getCurrentUser(userDetails);

        // Delete the attendance record
        attendanceService.deleteAttendance(
                id,
                currentUser
        );

        // Return HTTP 204 No Content after successful deletion
        return ResponseEntity.noContent().build();
    }
}
