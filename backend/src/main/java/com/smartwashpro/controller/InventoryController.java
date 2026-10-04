package com.smartwashpro.controller;

import com.smartwashpro.dto.request.InventoryRequest;
import com.smartwashpro.dto.request.StockUpdateRequest;
import com.smartwashpro.dto.response.InventoryResponse;
import com.smartwashpro.dto.response.StockTransactionResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Inventory;
import com.smartwashpro.model.StockTransaction;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.InventoryCategory;
import com.smartwashpro.model.enums.NotificationType;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.StockTransactionType;
import com.smartwashpro.repository.*;
import com.smartwashpro.security.SecurityUtils;
import com.smartwashpro.util.NotificationHelper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
public class InventoryController {
    private final InventoryRepository inventoryRepository;
    private final SupplierRepository supplierRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;
    private final SecurityUtils securityUtils;

    public InventoryController(InventoryRepository inventoryRepository,
                               SupplierRepository supplierRepository,
                               StockTransactionRepository stockTransactionRepository,
                               UserRepository userRepository,
                               NotificationHelper notificationHelper,
                               SecurityUtils securityUtils) {
        this.inventoryRepository = inventoryRepository;
        this.supplierRepository = supplierRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.userRepository = userRepository;
        this.notificationHelper = notificationHelper;
        this.securityUtils = securityUtils;
    }

    private InventoryResponse toResponse(Inventory i) {
        double qty = i.getQuantity() != null ? i.getQuantity() : 0.0;
        double min = i.getMinimumStockLevel() != null ? i.getMinimumStockLevel() : 0.0;
        boolean out = qty <= 0.0;
        boolean low = !out && qty < min;
        String status = out ? "OUT_OF_STOCK" : (low ? "LOW_STOCK" : "IN_STOCK");

        return InventoryResponse.builder()
                .id(i.getId())
                .itemName(i.getItemName())
                .category(i.getCategory() != null ? i.getCategory().name() : null)
                .quantity(qty)
                .unit(i.getUnit())
                .minimumStockLevel(min)
                .supplierId(i.getSupplier() != null ? i.getSupplier().getId() : null)
                .supplierName(i.getSupplier() != null ? i.getSupplier().getSupplierName() : null)
                .unitCost(i.getUnitCost())
                .branchId(i.getBranchId())
                .isActive(i.getIsActive() != null ? i.getIsActive() : true)
                .lowStock(low)
                .outOfStock(out)
                .stockStatus(status)
                .updatedAt(i.getUpdatedAt())
                .build();
    }

    private StockTransactionResponse toTxResponse(StockTransaction tx) {
        return StockTransactionResponse.builder()
                .id(tx.getId())
                .inventoryId(tx.getInventory().getId())
                .itemName(tx.getInventory().getItemName())
                .transactionType(tx.getTransactionType().name())
                .quantity(tx.getQuantity())
                .previousQuantity(tx.getPreviousQuantity())
                .newQuantity(tx.getNewQuantity())
                .notes(tx.getNotes())
                .createdByName(tx.getCreatedBy() != null ? tx.getCreatedBy().getFullName() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }

    @GetMapping
    public ResponseEntity<Page<InventoryResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) InventoryCategory category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Long branchId,
            @PageableDefault(size = 50, sort = "itemName", direction = Sort.Direction.ASC) Pageable pageable) {

        Long effectiveBranchId = null;
        if (securityUtils.isAdmin()) {
            effectiveBranchId = branchId;
        } else {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        Page<Inventory> page = inventoryRepository.filterInventory(
                effectiveBranchId,
                category,
                isActive,
                search,
                status,
                pageable
        );

        return ResponseEntity.ok(page.map(this::toResponse));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>> getLowStock() {
        Long userBranchId = securityUtils.isAdmin() ? null : securityUtils.getCurrentUserBranchId();
        List<Inventory> lowStockItems = inventoryRepository.findLowStockItems();
        return ResponseEntity.ok(lowStockItems.stream()
                .filter(i -> userBranchId == null || userBranchId.equals(i.getBranchId()))
                .map(this::toResponse)
                .toList());
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<InventoryResponse>> getOutOfStock() {
        Long userBranchId = securityUtils.isAdmin() ? null : securityUtils.getCurrentUserBranchId();
        List<Inventory> outOfStockItems = inventoryRepository.findOutOfStockItems();
        return ResponseEntity.ok(outOfStockItems.stream()
                .filter(i -> userBranchId == null || userBranchId.equals(i.getBranchId()))
                .map(this::toResponse)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryResponse> getById(@PathVariable Long id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());
        return ResponseEntity.ok(toResponse(inventory));
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<StockTransactionResponse>> getItemTransactions(@PathVariable Long id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        List<StockTransaction> txs = stockTransactionRepository.findByInventoryIdOrderByCreatedAtDesc(id);
        return ResponseEntity.ok(txs.stream().map(this::toTxResponse).toList());
    }

    @PostMapping
    public ResponseEntity<InventoryResponse> create(
            @RequestBody InventoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new BusinessRuleException("Stock quantity cannot be negative.");
        }
        if (request.getMinimumStockLevel() != null && request.getMinimumStockLevel() < 0) {
            throw new BusinessRuleException("Minimum stock level cannot be negative.");
        }

        Long targetBranchId;
        if (securityUtils.isAdmin()) {
            targetBranchId = request.getBranchId();
        } else {
            targetBranchId = securityUtils.getCurrentUserBranchId();
        }

        Inventory inventory = Inventory.builder()
                .itemName(request.getItemName())
                .category(request.getCategory() != null ? request.getCategory() : InventoryCategory.DETERGENT)
                .quantity(request.getQuantity() != null ? request.getQuantity() : 0.0)
                .unit(request.getUnit())
                .minimumStockLevel(request.getMinimumStockLevel() != null ? request.getMinimumStockLevel() : 0.0)
                .unitCost(request.getUnitCost())
                .branchId(targetBranchId)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        if (request.getSupplierId() != null) {
            inventory.setSupplier(supplierRepository.findById(request.getSupplierId()).orElse(null));
        }

        Inventory saved = inventoryRepository.save(inventory);

        // Record initial stock transaction if quantity > 0
        if (saved.getQuantity() > 0 && userDetails != null) {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
            StockTransaction tx = StockTransaction.builder()
                    .inventory(saved)
                    .transactionType(StockTransactionType.RESTOCK)
                    .quantity(saved.getQuantity())
                    .previousQuantity(0.0)
                    .newQuantity(saved.getQuantity())
                    .notes("Initial stock entry")
                    .createdBy(user)
                    .build();
            stockTransactionRepository.save(tx);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryResponse> update(
            @PathVariable Long id,
            @RequestBody InventoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        if (request.getMinimumStockLevel() != null) {
            if (request.getMinimumStockLevel() < 0) {
                throw new BusinessRuleException("Minimum stock level cannot be negative.");
            }
            inventory.setMinimumStockLevel(request.getMinimumStockLevel());
        }

        if (request.getItemName() != null) inventory.setItemName(request.getItemName());
        if (request.getCategory() != null) inventory.setCategory(request.getCategory());
        if (request.getUnit() != null) inventory.setUnit(request.getUnit());
        if (request.getUnitCost() != null) inventory.setUnitCost(request.getUnitCost());
        if (request.getIsActive() != null) inventory.setIsActive(request.getIsActive());

        if (request.getSupplierId() != null) {
            inventory.setSupplier(supplierRepository.findById(request.getSupplierId()).orElse(null));
        }

        if (securityUtils.isAdmin() && request.getBranchId() != null) {
            inventory.setBranchId(request.getBranchId());
        }

        // Handle quantity adjustment if changed
        if (request.getQuantity() != null) {
            if (request.getQuantity() < 0) {
                throw new BusinessRuleException("Stock quantity cannot be negative.");
            }
            double prev = inventory.getQuantity();
            double newQty = request.getQuantity();
            if (Double.compare(prev, newQty) != 0) {
                inventory.setQuantity(newQty);
                User user = userDetails != null ? userRepository.findByEmail(userDetails.getUsername()).orElse(null) : null;
                StockTransaction tx = StockTransaction.builder()
                        .inventory(inventory)
                        .transactionType(StockTransactionType.ADJUSTMENT)
                        .quantity(Math.abs(newQty - prev))
                        .previousQuantity(prev)
                        .newQuantity(newQty)
                        .notes("Manual stock level adjustment")
                        .createdBy(user)
                        .build();
                stockTransactionRepository.save(tx);
            }
        }

        return ResponseEntity.ok(toResponse(inventoryRepository.save(inventory)));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<InventoryResponse> deactivate(@PathVariable Long id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        inventory.setIsActive(false);
        return ResponseEntity.ok(toResponse(inventoryRepository.save(inventory)));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<InventoryResponse> activate(@PathVariable Long id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        inventory.setIsActive(true);
        return ResponseEntity.ok(toResponse(inventoryRepository.save(inventory)));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<InventoryResponse> toggleStatus(@PathVariable Long id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        boolean current = inventory.getIsActive() != null ? inventory.getIsActive() : true;
        inventory.setIsActive(!current);
        return ResponseEntity.ok(toResponse(inventoryRepository.save(inventory)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean permanent) {

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        if (permanent) {
            inventoryRepository.deleteById(id);
        } else {
            // Soft deactivation
            inventory.setIsActive(false);
            inventoryRepository.save(inventory);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restock")
    public ResponseEntity<InventoryResponse> restock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (request.getQuantity() <= 0) {
            throw new BusinessRuleException("Restock quantity must be greater than zero.");
        }

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        double prev = inventory.getQuantity();
        double updated = prev + request.getQuantity();
        inventory.setQuantity(updated);
        inventoryRepository.save(inventory);

        StockTransaction tx = StockTransaction.builder()
                .inventory(inventory)
                .transactionType(StockTransactionType.RESTOCK)
                .quantity(request.getQuantity())
                .previousQuantity(prev)
                .newQuantity(updated)
                .notes(request.getNotes() != null && !request.getNotes().isBlank() ? request.getNotes() : "Stock replenished")
                .createdBy(user)
                .build();
        stockTransactionRepository.save(tx);

        return ResponseEntity.ok(toResponse(inventory));
    }

    @PostMapping("/{id}/use")
    public ResponseEntity<InventoryResponse> use(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (request.getQuantity() <= 0) {
            throw new BusinessRuleException("Usage quantity must be greater than zero.");
        }

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        // Stock must NEVER become negative
        if (inventory.getQuantity() < request.getQuantity()) {
            throw new BusinessRuleException("Insufficient stock. Available stock: " + inventory.getQuantity() + " " +
                    (inventory.getUnit() != null ? inventory.getUnit() : "units") + ", requested: " + request.getQuantity());
        }

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        double prev = inventory.getQuantity();
        double updated = prev - request.getQuantity();
        inventory.setQuantity(updated);
        inventoryRepository.save(inventory);

        StockTransaction tx = StockTransaction.builder()
                .inventory(inventory)
                .transactionType(StockTransactionType.USAGE)
                .quantity(request.getQuantity())
                .previousQuantity(prev)
                .newQuantity(updated)
                .notes(request.getNotes() != null && !request.getNotes().isBlank() ? request.getNotes() : "Stock consumption")
                .createdBy(user)
                .build();
        stockTransactionRepository.save(tx);

        // Low stock / Out of stock detection alerts
        if (updated <= 0.0) {
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.BRANCH_MANAGER_ADMIN || u.getRole() == Role.ADMIN)
                    .forEach(u -> notificationHelper.send(u, "OUT OF STOCK Alert",
                            "Item '" + inventory.getItemName() + "' is completely OUT OF STOCK (0 " + (inventory.getUnit() != null ? inventory.getUnit() : "") + "). Immediate restock required.",
                            NotificationType.LOW_INVENTORY));
        } else if (updated < inventory.getMinimumStockLevel()) {
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.BRANCH_MANAGER_ADMIN || u.getRole() == Role.ADMIN)
                    .forEach(u -> notificationHelper.send(u, "Low Stock Alert",
                            "Item '" + inventory.getItemName() + "' is below minimum stock level (" + inventory.getMinimumStockLevel() + "). Remaining: " + updated + " " + (inventory.getUnit() != null ? inventory.getUnit() : ""),
                            NotificationType.LOW_INVENTORY));
        }

        return ResponseEntity.ok(toResponse(inventory));
    }

    @PostMapping("/{id}/adjust")
    public ResponseEntity<InventoryResponse> adjust(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (request.getQuantity() < 0) {
            throw new BusinessRuleException("Stock quantity cannot be negative.");
        }

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        securityUtils.validateBranchAccess(inventory.getBranchId());

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        double prev = inventory.getQuantity();
        double newQty = request.getQuantity();
        inventory.setQuantity(newQty);
        inventoryRepository.save(inventory);

        StockTransaction tx = StockTransaction.builder()
                .inventory(inventory)
                .transactionType(StockTransactionType.ADJUSTMENT)
                .quantity(Math.abs(newQty - prev))
                .previousQuantity(prev)
                .newQuantity(newQty)
                .notes(request.getNotes() != null && !request.getNotes().isBlank() ? request.getNotes() : "Stock count reconciliation")
                .createdBy(user)
                .build();
        stockTransactionRepository.save(tx);

        return ResponseEntity.ok(toResponse(inventory));
    }
}
