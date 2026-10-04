package com.smartwashpro.controller;

import com.smartwashpro.dto.request.PickupRequest;
import com.smartwashpro.dto.response.PickupResponse;
import com.smartwashpro.model.User;
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.service.PickupService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pickups")
public class PickupController {
    private final PickupService pickupService;
    private final UserRepository userRepository;

    public PickupController(PickupService pickupService, UserRepository userRepository) {
        this.pickupService = pickupService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername()).orElse(null);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER', 'CUSTOMER')")
    public ResponseEntity<Page<PickupResponse>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        User currentUser = getCurrentUser(userDetails);
        Page<PickupResponse> result = pickupService.filterPickups(status, date, search, driverId, customerId, branchId, currentUser, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<PickupResponse>> getMyPickups(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        User currentUser = getCurrentUser(userDetails);
        Page<PickupResponse> result = pickupService.filterPickups(status, date, search, null, null, null, currentUser, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER', 'CUSTOMER')")
    public ResponseEntity<PickupResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(pickupService.getPickupById(id, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<PickupResponse> create(
            @RequestBody PickupRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        PickupResponse created = pickupService.createPickup(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<PickupResponse> assignDriver(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        Object dIdObj = body.get("driverId");
        if (dIdObj == null) {
            throw new IllegalArgumentException("Driver ID is required");
        }
        Long driverId = Long.valueOf(dIdObj.toString());
        return ResponseEntity.ok(pickupService.assignDriver(id, driverId, currentUser));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER', 'CUSTOMER')")
    public ResponseEntity<PickupResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        String status = (String) body.get("status");
        Long driverId = null;
        if (body.containsKey("driverId") && body.get("driverId") != null) {
            driverId = Long.valueOf(body.get("driverId").toString());
        }
        return ResponseEntity.ok(pickupService.updateStatus(id, status, driverId, currentUser));
    }

    @PutMapping("/{id}/collect")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER')")
    public ResponseEntity<PickupResponse> markAsCollected(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(pickupService.markAsCollected(id, currentUser));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<PickupResponse> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(pickupService.cancelPickup(id, currentUser));
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<List<Map<String, Object>>> getDrivers(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(pickupService.getAvailableDrivers(branchId));
    }

    @GetMapping("/eligible-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<List<Map<String, Object>>> getEligibleOrders(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(pickupService.getEligibleOrders(customerId, branchId, currentUser));
    }
}
