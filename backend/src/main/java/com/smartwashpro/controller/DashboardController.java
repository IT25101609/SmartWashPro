package com.smartwashpro.controller;

import com.smartwashpro.dto.response.DashboardResponse;
import com.smartwashpro.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }


    @GetMapping("/manager")
    public ResponseEntity<DashboardResponse> managerDashboard() {
        return ResponseEntity.ok(dashboardService.getManagerDashboard());
    }

    @GetMapping("/customer")
    public ResponseEntity<DashboardResponse> customerDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(dashboardService.getCustomerDashboard(userDetails.getUsername()));
    }

    @GetMapping("/finance")
    public ResponseEntity<DashboardResponse> financeDashboard() {
        return ResponseEntity.ok(dashboardService.getFinanceDashboard());
    }

    @GetMapping("/receptionist")
    public ResponseEntity<DashboardResponse> receptionistDashboard() {
        return ResponseEntity.ok(dashboardService.getManagerDashboard());
    }

    @GetMapping("/staff")
    public ResponseEntity<DashboardResponse> staffDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(dashboardService.getStaffDashboard(userDetails.getUsername()));
    }

    @GetMapping("/driver")
    public ResponseEntity<DashboardResponse> driverDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(dashboardService.getStaffDashboard(userDetails.getUsername()));
    }
}
