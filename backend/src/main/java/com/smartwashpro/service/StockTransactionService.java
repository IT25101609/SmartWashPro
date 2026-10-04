package com.smartwashpro.service;

import com.smartwashpro.dto.request.StockTransactionRequest;
import com.smartwashpro.dto.response.StockTransactionResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Inventory;
import com.smartwashpro.model.StockTransaction;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.NotificationType;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.StockTransactionType;
import com.smartwashpro.repository.InventoryRepository;
import com.smartwashpro.repository.StockTransactionRepository;
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.security.SecurityUtils;
import com.smartwashpro.util.NotificationHelper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StockTransactionService {

    private final StockTransactionRepository stockTransactionRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;
    private final SecurityUtils securityUtils;

    public StockTransactionService(StockTransactionRepository stockTransactionRepository,
                                   InventoryRepository inventoryRepository,
                                   UserRepository userRepository,
                                   NotificationHelper notificationHelper,
                                   SecurityUtils securityUtils) {
        this.stockTransactionRepository = stockTransactionRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.notificationHelper = notificationHelper;
        this.securityUtils = securityUtils;
    }

    public StockTransactionResponse toResponse(StockTransaction tx) {
        String unit = tx.getInventory() != null ? tx.getInventory().getUnit() : null;
        Long branchId = tx.getInventory() != null ? tx.getInventory().getBranchId() : null;
        String itemName = tx.getInventory() != null ? tx.getInventory().getItemName() : null;
        Long invId = tx.getInventory() != null ? tx.getInventory().getId() : null;
        Long userId = tx.getCreatedBy() != null ? tx.getCreatedBy().getId() : null;
        String userName = tx.getCreatedBy() != null ? tx.getCreatedBy().getFullName() : "System";

        return StockTransactionResponse.builder()
                .id(tx.getId())
                .inventoryId(invId)
                .itemName(itemName)
                .unit(unit)
                .transactionType(tx.getTransactionType() != null ? tx.getTransactionType().name() : null)
                .quantity(tx.getQuantity())
                .previousQuantity(tx.getPreviousQuantity())
                .newQuantity(tx.getNewQuantity())
                .notes(tx.getNotes())
                .createdById(userId)
                .createdByName(userName)
                .branchId(branchId)
                .createdAt(tx.getCreatedAt())
                .build();
    }

    public Page<StockTransactionResponse> getTransactions(
            Long inventoryId,
            Long branchId,
            StockTransactionType type,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            Pageable pageable) {

        Long effectiveBranchId = null;
        if (securityUtils.isAdmin()) {
            effectiveBranchId = branchId;
        } else {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        Page<StockTransaction> page = stockTransactionRepository.filterTransactions(
                inventoryId,
                effectiveBranchId,
                type,
                startDate,
                endDate,
                search,
                pageable
        );

        return page.map(this::toResponse);
    }

    public StockTransactionResponse getTransactionById(Long id) {
        StockTransaction tx = stockTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockTransaction", id));

        if (tx.getInventory() != null) {
            securityUtils.validateBranchAccess(tx.getInventory().getBranchId());
        }
        return toResponse(tx);
    }

    @Transactional
    public StockTransactionResponse recordTransaction(StockTransactionRequest request, User fallbackUser) {
        if (request.getInventoryId() == null) {
            throw new BusinessRuleException("Inventory item ID is required.");
        }
        if (request.getTransactionType() == null) {
            throw new BusinessRuleException("Transaction type is required (RESTOCK, USAGE, WASTE, ADJUSTMENT).");
        }

        Inventory inventory = inventoryRepository.findById(request.getInventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", request.getInventoryId()));

        securityUtils.validateBranchAccess(inventory.getBranchId());

        User recordedBy = fallbackUser;
        if (request.getEmployeeId() != null) {
            recordedBy = userRepository.findById(request.getEmployeeId()).orElse(fallbackUser);
        }

        double prev = inventory.getQuantity() != null ? inventory.getQuantity() : 0.0;
        double next;
        double recordedQty;

        StockTransactionType type = request.getTransactionType();

        switch (type) {
            case RESTOCK:
                if (request.getQuantity() == null || request.getQuantity() <= 0) {
                    throw new BusinessRuleException("Restock quantity must be greater than zero.");
                }
                recordedQty = request.getQuantity();
                next = prev + recordedQty;
                break;

            case USAGE:
                if (request.getQuantity() == null || request.getQuantity() <= 0) {
                    throw new BusinessRuleException("Usage quantity must be greater than zero.");
                }
                recordedQty = request.getQuantity();
                if (prev < recordedQty) {
                    throw new BusinessRuleException("Insufficient stock. Available stock: " + prev + " " +
                            (inventory.getUnit() != null ? inventory.getUnit() : "units") +
                            ", requested usage: " + recordedQty + ". Stock must never become negative.");
                }
                next = prev - recordedQty;
                break;

            case WASTE:
                if (request.getQuantity() == null || request.getQuantity() <= 0) {
                    throw new BusinessRuleException("Waste quantity must be greater than zero.");
                }
                recordedQty = request.getQuantity();
                if (prev < recordedQty) {
                    throw new BusinessRuleException("Reported waste cannot exceed available stock. Available stock: " + prev + " " +
                            (inventory.getUnit() != null ? inventory.getUnit() : "units") +
                            ", reported waste: " + recordedQty + ". Stock must never become negative.");
                }
                next = prev - recordedQty;
                break;

            case ADJUSTMENT:
                if ("DELTA".equalsIgnoreCase(request.getAdjustmentMode())) {
                    if (request.getQuantity() == null) {
                        throw new BusinessRuleException("Adjustment delta quantity is required.");
                    }
                    next = prev + request.getQuantity();
                    if (next < 0) {
                        throw new BusinessRuleException("Resulting stock level cannot be negative (" + next + "). Stock must never become negative.");
                    }
                    recordedQty = Math.abs(request.getQuantity());
                } else {
                    // Default "SET" target quantity
                    if (request.getQuantity() == null || request.getQuantity() < 0) {
                        throw new BusinessRuleException("Adjusted stock quantity cannot be negative.");
                    }
                    next = request.getQuantity();
                    recordedQty = Math.abs(next - prev);
                }
                break;

            default:
                throw new BusinessRuleException("Unsupported stock transaction type: " + type);
        }

        // Update inventory quantity atomically
        inventory.setQuantity(next);
        inventoryRepository.save(inventory);

        // Build stock transaction
        LocalDateTime txDate = request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now();

        StockTransaction tx = StockTransaction.builder()
                .inventory(inventory)
                .transactionType(type)
                .quantity(recordedQty)
                .previousQuantity(prev)
                .newQuantity(next)
                .notes(request.getNotes() != null && !request.getNotes().isBlank() ? request.getNotes().trim() : ("Stock " + type.name().toLowerCase()))
                .createdBy(recordedBy)
                .createdAt(txDate)
                .build();

        StockTransaction savedTx = stockTransactionRepository.save(tx);

        // Stock alerts
        if (next <= 0.0) {
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.BRANCH_MANAGER_ADMIN || u.getRole() == Role.ADMIN)
                    .forEach(u -> notificationHelper.send(u, "OUT OF STOCK Alert",
                            "Item '" + inventory.getItemName() + "' is completely OUT OF STOCK (0 " + (inventory.getUnit() != null ? inventory.getUnit() : "") + ").",
                            NotificationType.LOW_INVENTORY));
        } else if (next < inventory.getMinimumStockLevel()) {
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.BRANCH_MANAGER_ADMIN || u.getRole() == Role.ADMIN)
                    .forEach(u -> notificationHelper.send(u, "Low Stock Alert",
                            "Item '" + inventory.getItemName() + "' is below minimum stock level (" + inventory.getMinimumStockLevel() + "). Remaining: " + next + " " + (inventory.getUnit() != null ? inventory.getUnit() : ""),
                            NotificationType.LOW_INVENTORY));
        }

        return toResponse(savedTx);
    }
}
