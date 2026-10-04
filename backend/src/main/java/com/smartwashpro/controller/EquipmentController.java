package com.smartwashpro.controller;

import com.smartwashpro.dto.request.BreakdownRequest;
import com.smartwashpro.dto.request.EquipmentRequest;
import com.smartwashpro.dto.request.MaintenanceRequest;
import com.smartwashpro.dto.response.BreakdownResponse;
import com.smartwashpro.dto.response.EquipmentResponse;
import com.smartwashpro.dto.response.MaintenanceResponse;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Breakdown;
import com.smartwashpro.model.Equipment;
import com.smartwashpro.model.Maintenance;
import com.smartwashpro.model.enums.EquipmentStatus;
import com.smartwashpro.repository.BreakdownRepository;
import com.smartwashpro.repository.EquipmentRepository;
import com.smartwashpro.repository.MaintenanceRepository;
import com.smartwashpro.security.SecurityUtils;
import com.smartwashpro.service.BreakdownService;
import com.smartwashpro.service.EquipmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class EquipmentController {
    private final EquipmentService equipmentService;
    private final EquipmentRepository equipmentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final BreakdownRepository breakdownRepository;
    private final BreakdownService breakdownService;
    private final SecurityUtils securityUtils;

    public EquipmentController(EquipmentService equipmentService,
                               EquipmentRepository equipmentRepository,
                               MaintenanceRepository maintenanceRepository,
                               BreakdownRepository breakdownRepository,
                               BreakdownService breakdownService,
                               SecurityUtils securityUtils) {
        this.equipmentService = equipmentService;
        this.equipmentRepository = equipmentRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.breakdownRepository = breakdownRepository;
        this.breakdownService = breakdownService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<Page<EquipmentResponse>> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String equipmentType,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        EquipmentStatus eqStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            eqStatus = EquipmentStatus.fromString(status.trim());
        }
        return ResponseEntity.ok(equipmentService.getEquipment(branchId, eqStatus, equipmentType, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    @PostMapping
    public ResponseEntity<EquipmentResponse> create(@RequestBody EquipmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createEquipment(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponse> update(@PathVariable Long id, @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<EquipmentResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        EquipmentStatus status = EquipmentStatus.fromString(statusStr);
        return ResponseEntity.ok(equipmentService.updateStatus(id, status));
    }

    @PutMapping("/{id}/branch")
    public ResponseEntity<EquipmentResponse> assignBranch(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Object branchIdObj = body.get("branchId");
        Long branchId = null;
        if (branchIdObj != null) {
            branchId = Long.valueOf(branchIdObj.toString());
        }
        return ResponseEntity.ok(equipmentService.assignBranch(id, branchId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/maintenance")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceHistory(@PathVariable Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        return ResponseEntity.ok(maintenanceRepository.findByEquipmentIdOrderByScheduledDateDesc(id)
                .stream().map(m -> MaintenanceResponse.builder()
                        .id(m.getId())
                        .equipmentId(id)
                        .equipmentName(m.getEquipment() != null ? m.getEquipment().getEquipmentName() : equipment.getEquipmentName())
                        .scheduledDate(m.getScheduledDate())
                        .completedDate(m.getCompletedDate())
                        .maintenanceType(m.getMaintenanceType())
                        .description(m.getDescription())
                        .performedBy(m.getPerformedBy())
                        .cost(m.getCost())
                        .status(m.getStatus() != null ? m.getStatus().name() : "SCHEDULED")
                        .createdAt(m.getCreatedAt())
                        .build()).toList());
    }

    @PostMapping("/{id}/maintenance")
    @Transactional
    public ResponseEntity<MaintenanceResponse> scheduleMaintenance(
            @PathVariable Long id, @RequestBody MaintenanceRequest request) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        Maintenance maintenance = Maintenance.builder()
                .equipment(equipment)
                .scheduledDate(request.getScheduledDate() != null ? request.getScheduledDate() : LocalDate.now())
                .completedDate(request.getCompletedDate())
                .maintenanceType(request.getMaintenanceType())
                .description(request.getDescription())
                .performedBy(request.getPerformedBy())
                .cost(request.getCost())
                .build();
        maintenance = maintenanceRepository.save(maintenance);

        // Synchronize equipment status to MAINTENANCE
        equipment.setStatus(EquipmentStatus.MAINTENANCE);
        equipmentRepository.save(equipment);

        return ResponseEntity.status(HttpStatus.CREATED).body(MaintenanceResponse.builder()
                .id(maintenance.getId())
                .equipmentId(id)
                .equipmentName(equipment.getEquipmentName())
                .scheduledDate(maintenance.getScheduledDate())
                .completedDate(maintenance.getCompletedDate())
                .maintenanceType(maintenance.getMaintenanceType())
                .description(maintenance.getDescription())
                .performedBy(maintenance.getPerformedBy())
                .cost(maintenance.getCost())
                .status(maintenance.getStatus() != null ? maintenance.getStatus().name() : "SCHEDULED")
                .createdAt(maintenance.getCreatedAt())
                .build());
    }

    @GetMapping("/{id}/breakdowns")
    public ResponseEntity<List<BreakdownResponse>> getBreakdownHistory(@PathVariable Long id) {
        return ResponseEntity.ok(breakdownService.getBreakdownsByEquipment(id));
    }

    @PostMapping("/{id}/breakdowns")
    public ResponseEntity<BreakdownResponse> reportBreakdown(
            @PathVariable Long id, @RequestBody BreakdownRequest request) {
        request.setEquipmentId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(breakdownService.reportBreakdown(request));
    }
}
