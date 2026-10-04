package com.smartwashpro.controller;

import com.smartwashpro.dto.request.DeliveryRequest;
import com.smartwashpro.dto.response.DeliveryResponse;
import com.smartwashpro.model.User;
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.service.DeliveryService;
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
@RequestMapping("/api/deliveries")
public class DeliveryController {
    private final DeliveryService deliveryService;
    private final UserRepository userRepository;

    public DeliveryController(DeliveryService deliveryService, UserRepository userRepository) {
        this.deliveryService = deliveryService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername()).orElse(null);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER', 'CUSTOMER')")
    public ResponseEntity<Page<DeliveryResponse>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        User currentUser = getCurrentUser(userDetails);
        Page<DeliveryResponse> result = deliveryService.filterDeliveries(status, date, search, driverId, customerId, branchId, currentUser, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<DeliveryResponse>> getMyDeliveries(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        User currentUser = getCurrentUser(userDetails);
        Page<DeliveryResponse> result = deliveryService.filterDeliveries(status, date, search, null, null, null, currentUser, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER', 'CUSTOMER')")
    public ResponseEntity<DeliveryResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(deliveryService.getDeliveryById(id, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<DeliveryResponse> create(
            @RequestBody DeliveryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        DeliveryResponse created = deliveryService.createDelivery(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<DeliveryResponse> assignDriver(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        Object dIdObj = body.get("driverId");
        if (dIdObj == null) {
            throw new IllegalArgumentException("Driver ID is required");
        }
        Long driverId = Long.valueOf(dIdObj.toString());
        return ResponseEntity.ok(deliveryService.assignDriver(id, driverId, currentUser));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER')")
    public ResponseEntity<DeliveryResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        String status = (String) body.get("status");
        Long driverId = null;
        if (body.containsKey("driverId") && body.get("driverId") != null) {
            driverId = Long.valueOf(body.get("driverId").toString());
        }
        return ResponseEntity.ok(deliveryService.updateStatus(id, status, driverId, currentUser));
    }

    @PutMapping("/{id}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER')")
    public ResponseEntity<DeliveryResponse> markAsDelivered(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(deliveryService.markAsDelivered(id, currentUser));
    }

    @PutMapping("/{id}/fail")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'DELIVERY_DRIVER')")
    public ResponseEntity<DeliveryResponse> markAsFailed(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(deliveryService.markAsFailed(id, reason, currentUser));
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<List<Map<String, Object>>> getDrivers(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(deliveryService.getAvailableDrivers(branchId));
    }

    @GetMapping("/eligible-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<List<Map<String, Object>>> getEligibleOrders(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getCurrentUser(userDetails);
        return ResponseEntity.ok(deliveryService.getEligibleOrders(customerId, branchId, currentUser));
    }
}
