package com.smartwashpro.controller;

import com.smartwashpro.dto.request.SupplierRequest;
import com.smartwashpro.dto.response.InventoryResponse;
import com.smartwashpro.dto.response.SupplierResponse;
import com.smartwashpro.model.enums.SupplierStatus;
import com.smartwashpro.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public ResponseEntity<Page<SupplierResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) SupplierStatus status,
            @PageableDefault(size = 50, sort = "supplierName", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(supplierService.getAllSuppliers(search, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> update(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, request));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<SupplierResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.activateSupplier(id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<SupplierResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.deactivateSupplier(id));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<SupplierResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.toggleStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean force) {
        supplierService.deleteSupplier(id, force);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<InventoryResponse>> getSuppliedItems(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getSuppliedItems(id));
    }

    @PostMapping("/{id}/associate-items")
    public ResponseEntity<List<InventoryResponse>> associateItems(
            @PathVariable Long id,
            @RequestBody List<Long> inventoryItemIds) {
        return ResponseEntity.ok(supplierService.associateItems(id, inventoryItemIds));
    }

    @DeleteMapping("/{id}/items/{inventoryId}")
    public ResponseEntity<Void> disassociateItem(
            @PathVariable Long id,
            @PathVariable Long inventoryId) {
        supplierService.disassociateItem(id, inventoryId);
        return ResponseEntity.noContent().build();
    }
}
