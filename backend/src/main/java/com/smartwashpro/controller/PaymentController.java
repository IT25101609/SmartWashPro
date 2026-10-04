package com.smartwashpro.controller;

import com.smartwashpro.dto.request.PaymentRequest;
import com.smartwashpro.dto.response.PaymentResponse;
import com.smartwashpro.model.enums.PaymentStatus;
import com.smartwashpro.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<Page<PaymentResponse>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(paymentService.getFilteredPayments(status, method, branchId, search, email, pageable));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<PaymentResponse>> getMyPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(paymentService.getFilteredPayments(status, method, null, search, email, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<PaymentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<PaymentResponse> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    @GetMapping("/unpaid-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<List<Map<String, Object>>> getUnpaidOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(paymentService.getOrdersPendingPayment(email));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<PaymentResponse> recordPayment(
            @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.recordPayment(request, email));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<PaymentResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        String txnRef = body.get("transactionReference");
        PaymentStatus newStatus = PaymentStatus.valueOf(statusStr.toUpperCase().trim());
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, newStatus, txnRef));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<PaymentResponse> update(
            @PathVariable Long id,
            @RequestBody PaymentRequest request) {
        PaymentStatus status = request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PAID;
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, status, request.getTransactionReference()));
    }
}
