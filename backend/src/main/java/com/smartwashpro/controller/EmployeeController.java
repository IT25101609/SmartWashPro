package com.smartwashpro.controller;

import com.smartwashpro.dto.request.EmployeeRequest;
import com.smartwashpro.dto.response.AttendanceResponse;
import com.smartwashpro.dto.response.EmployeeResponse;
import com.smartwashpro.dto.response.TaskResponse;
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<Page<EmployeeResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) EmploymentStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(employeeService.getAllEmployees(search, branchId, role, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> update(@PathVariable Long id, @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @PutMapping("/{id}/branch")
    public ResponseEntity<EmployeeResponse> assignBranch(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long branchId = null;
        if (body.containsKey("branchId") && body.get("branchId") != null) {
            branchId = Long.valueOf(body.get("branchId").toString());
        }
        return ResponseEntity.ok(employeeService.assignBranch(id, branchId));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<EmployeeResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.activateEmployee(id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<EmployeeResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.deactivateEmployee(id));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<EmployeeResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.toggleStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<Page<TaskResponse>> getAssignedTasks(
            @PathVariable Long id,
            @PageableDefault(size = 20, sort = "assignedDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(employeeService.getEmployeeTasks(id, pageable));
    }

    @GetMapping("/{id}/attendance")
    public ResponseEntity<Page<AttendanceResponse>> getAttendance(
            @PathVariable Long id,
            @PageableDefault(size = 50, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(employeeService.getEmployeeAttendance(id, pageable));
    }
}
