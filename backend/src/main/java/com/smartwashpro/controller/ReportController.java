package com.smartwashpro.controller;

import com.smartwashpro.dto.response.ReportDataResponse;
import com.smartwashpro.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/meta")
    public ResponseEntity<Map<String, Object>> getFiltersMeta() {
        return ResponseEntity.ok(reportService.getFiltersMetadata());
    }

    @GetMapping("/data")
    public ResponseEntity<ReportDataResponse> getReportData(
            @RequestParam(required = false, defaultValue = "DAILY_ORDERS") String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long serviceId) {
        return ResponseEntity.ok(reportService.generateReport(type, startDate, endDate, branchId, status, employeeId, serviceId));
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportReport(
            @RequestParam(required = false, defaultValue = "DAILY_ORDERS") String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long serviceId) {
        ReportDataResponse report = reportService.generateReport(type, startDate, endDate, branchId, status, employeeId, serviceId);
        String csv = reportService.exportToCsv(report);

        String filename = "SmartWash_" + report.getReportType() + "_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        ReportDataResponse report = reportService.generateReport("DAILY_ORDERS", null, null, null, null, null, null);
        return ResponseEntity.ok(report.getSummary());
    }
}
