package com.smartwashpro.controller;

import com.smartwashpro.dto.request.BreakdownRequest;
import com.smartwashpro.dto.response.BreakdownResponse;
import com.smartwashpro.model.enums.BreakdownStatus;
import com.smartwashpro.service.BreakdownService;
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
@RequestMapping("/api/breakdowns")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class BreakdownController {
    private final BreakdownService breakdownService;

    public BreakdownController(BreakdownService breakdownService) {
        this.breakdownService = breakdownService;
    }

    @GetMapping
    public ResponseEntity<Page<BreakdownResponse>> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long equipmentId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        BreakdownStatus bdStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            bdStatus = BreakdownStatus.fromString(status);
        }
        return ResponseEntity.ok(breakdownService.getBreakdowns(branchId, bdStatus, equipmentId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BreakdownResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(breakdownService.getBreakdownById(id));
    }

    @GetMapping("/active")
    public ResponseEntity<List<BreakdownResponse>> getActive(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(breakdownService.getActiveBreakdowns(branchId));
    }

    @GetMapping("/resolved")
    public ResponseEntity<List<BreakdownResponse>> getResolved(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(breakdownService.getResolvedBreakdowns(branchId));
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<BreakdownResponse>> getByEquipment(@PathVariable Long equipmentId) {
        return ResponseEntity.ok(breakdownService.getBreakdownsByEquipment(equipmentId));
    }

    @PostMapping
    public ResponseEntity<BreakdownResponse> create(@RequestBody BreakdownRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(breakdownService.reportBreakdown(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BreakdownResponse> update(
            @PathVariable Long id, @RequestBody BreakdownRequest request) {
        return ResponseEntity.ok(breakdownService.updateBreakdown(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BreakdownResponse> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        String statusStr = (String) body.get("status");
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        BreakdownStatus newStatus = BreakdownStatus.fromString(statusStr);

        String repairNotes = body.get("repairNotes") != null ? body.get("repairNotes").toString()
                : (body.get("repairDetails") != null ? body.get("repairDetails").toString() : null);
        String technician = body.get("technician") != null ? body.get("technician").toString() : null;

        BigDecimal repairCost = null;
        if (body.get("repairCost") != null && !body.get("repairCost").toString().trim().isEmpty()) {
            try {
                repairCost = new BigDecimal(body.get("repairCost").toString().trim());
            } catch (Exception ignored) {}
        }

        LocalDate repairedDate = null;
        if (body.get("repairedDate") != null && !body.get("repairedDate").toString().trim().isEmpty()) {
            try {
                repairedDate = LocalDate.parse(body.get("repairedDate").toString().trim());
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(breakdownService.updateStatus(id, newStatus, repairNotes, repairCost, repairedDate, technician));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<BreakdownResponse> closeBreakdown(
            @PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        String repairNotes = null;
        BigDecimal repairCost = null;
        LocalDate repairedDate = null;
        String technician = null;

        if (body != null) {
            repairNotes = body.get("repairNotes") != null ? body.get("repairNotes").toString()
                    : (body.get("repairDetails") != null ? body.get("repairDetails").toString() : null);
            technician = body.get("technician") != null ? body.get("technician").toString() : null;
            if (body.get("repairCost") != null && !body.get("repairCost").toString().trim().isEmpty()) {
                try {
                    repairCost = new BigDecimal(body.get("repairCost").toString().trim());
                } catch (Exception ignored) {}
            }
            if (body.get("repairedDate") != null && !body.get("repairedDate").toString().trim().isEmpty()) {
                try {
                    repairedDate = LocalDate.parse(body.get("repairedDate").toString().trim());
                } catch (Exception ignored) {}
            }
        }

        return ResponseEntity.ok(breakdownService.updateStatus(id, BreakdownStatus.CLOSED, repairNotes, repairCost, repairedDate, technician));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        breakdownService.deleteBreakdown(id);
        return ResponseEntity.noContent().build();
    }
}
