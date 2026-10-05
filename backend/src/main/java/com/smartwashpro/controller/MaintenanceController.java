package com.smartwashpro.controller;

import com.smartwashpro.dto.request.MaintenanceRequest;
import com.smartwashpro.dto.response.MaintenanceResponse;
import com.smartwashpro.model.enums.MaintenanceStatus;
import com.smartwashpro.service.MaintenanceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class MaintenanceController {
    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @GetMapping
    public ResponseEntity<Page<MaintenanceResponse>> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long equipmentId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        MaintenanceStatus maintStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                maintStatus = MaintenanceStatus.valueOf(status.trim().toUpperCase());
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(maintenanceService.getMaintenance(branchId, maintStatus, equipmentId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceById(id));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<MaintenanceResponse>> getUpcoming(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(maintenanceService.getUpcomingMaintenance(branchId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<MaintenanceResponse>> getHistory(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceHistory(branchId));
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<MaintenanceResponse>> getByEquipment(@PathVariable Long equipmentId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceByEquipment(equipmentId));
    }

    @PostMapping
    public ResponseEntity<MaintenanceResponse> create(@RequestBody MaintenanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.createMaintenance(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceResponse> update(
            @PathVariable Long id, @RequestBody MaintenanceRequest request) {
        return ResponseEntity.ok(maintenanceService.updateMaintenance(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MaintenanceResponse> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        String statusStr = (String) body.get("status");
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        MaintenanceStatus newStatus = MaintenanceStatus.valueOf(statusStr.trim().toUpperCase());

        String repairDetails = body.get("repairDetails") != null ? body.get("repairDetails").toString() : null;
        String performedBy = body.get("performedBy") != null ? body.get("performedBy").toString() : null;

        BigDecimal cost = null;
        if (body.get("cost") != null && !body.get("cost").toString().trim().isEmpty()) {
            try {
                cost = new BigDecimal(body.get("cost").toString().trim());
            } catch (Exception ignored) {}
        }

        LocalDate completedDate = null;
        if (body.get("completedDate") != null && !body.get("completedDate").toString().trim().isEmpty()) {
            try {
                completedDate = LocalDate.parse(body.get("completedDate").toString().trim());
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(maintenanceService.updateStatus(id, newStatus, repairDetails, cost, completedDate, performedBy));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        maintenanceService.deleteMaintenance(id);
        return ResponseEntity.noContent().build();
    }
}
