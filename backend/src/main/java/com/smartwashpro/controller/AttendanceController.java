package com.smartwashpro.controller;

import com.smartwashpro.dto.request.AttendanceRequest;
import com.smartwashpro.dto.response.AttendanceResponse;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.AttendanceStatus;
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.service.AttendanceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository userRepository;

    public AttendanceController(AttendanceService attendanceService, UserRepository userRepository) {
        this.attendanceService = attendanceService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername()).orElse(null);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<Page<AttendanceResponse>> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 50, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(attendanceService.getAttendance(branchId, employeeId, date, startDate, endDate, status, search, pageable));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<Page<AttendanceResponse>> getToday(
            @RequestParam(required = false) Long branchId,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(attendanceService.getAttendance(branchId, null, LocalDate.now(), null, null, null, null, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<AttendanceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.getAttendanceById(id));
    }

    @PostMapping("/check-in")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AttendanceResponse> checkIn(
            @RequestBody(required = false) AttendanceRequest request,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        Long targetEmpId = request != null && request.getEmployeeId() != null ? request.getEmployeeId() : employeeId;
        LocalDate targetDate = request != null && request.getDate() != null ? request.getDate() : date;
        LocalTime targetTime = request != null && request.getTime() != null ? request.getTime() :
                (request != null && request.getCheckIn() != null ? request.getCheckIn() : time);

        return ResponseEntity.ok(attendanceService.checkIn(targetEmpId, targetDate, targetTime, currentUser));
    }

    @PostMapping("/check-out")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AttendanceResponse> checkOut(
            @RequestBody(required = false) AttendanceRequest request,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        Long targetEmpId = request != null && request.getEmployeeId() != null ? request.getEmployeeId() : employeeId;
        LocalDate targetDate = request != null && request.getDate() != null ? request.getDate() : date;
        LocalTime targetTime = request != null && request.getTime() != null ? request.getTime() :
                (request != null && request.getCheckOut() != null ? request.getCheckOut() : time);

        return ResponseEntity.ok(attendanceService.checkOut(targetEmpId, targetDate, targetTime, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<AttendanceResponse> create(
            @RequestBody AttendanceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.recordAttendance(request, currentUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<AttendanceResponse> update(
            @PathVariable Long id,
            @RequestBody AttendanceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(attendanceService.updateAttendance(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        attendanceService.deleteAttendance(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
