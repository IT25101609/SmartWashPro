package com.smartwashpro.controller;

import com.smartwashpro.dto.request.StockTransactionRequest;
import com.smartwashpro.dto.response.StockTransactionResponse;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.StockTransactionType;
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.service.StockTransactionService;
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
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/stock-transactions")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class StockTransactionController {

    private final StockTransactionService stockTransactionService;
    private final UserRepository userRepository;

    public StockTransactionController(StockTransactionService stockTransactionService, UserRepository userRepository) {
        this.stockTransactionService = stockTransactionService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<StockTransactionResponse> createTransaction(
            @RequestBody StockTransactionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userDetails != null ? userRepository.findByEmail(userDetails.getUsername()).orElse(null) : null;
        StockTransactionResponse response = stockTransactionService.recordTransaction(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<StockTransactionResponse>> getAll(
            @RequestParam(required = false) Long inventoryId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) StockTransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<StockTransactionResponse> page = stockTransactionService.getTransactions(
                inventoryId,
                branchId,
                type,
                startDateTime,
                endDateTime,
                search,
                pageable
        );
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockTransactionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(stockTransactionService.getTransactionById(id));
    }

    @GetMapping("/inventory/{inventoryId}")
    public ResponseEntity<Page<StockTransactionResponse>> getByInventory(
            @PathVariable Long inventoryId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(stockTransactionService.getTransactions(inventoryId, null, null, null, null, null, pageable));
    }
}
