package com.smartwashpro.service;

import com.smartwashpro.dto.request.SupplierRequest;
import com.smartwashpro.dto.response.InventoryResponse;
import com.smartwashpro.dto.response.SupplierResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Inventory;
import com.smartwashpro.model.Supplier;
import com.smartwashpro.model.enums.SupplierStatus;
import com.smartwashpro.repository.InventoryRepository;
import com.smartwashpro.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class SupplierService {
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[+0-9\\s\\-\\(\\)]{7,25}$");

    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;

    public SupplierService(SupplierRepository supplierRepository, InventoryRepository inventoryRepository) {
        this.supplierRepository = supplierRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public SupplierResponse toResponse(Supplier s) {
        long count = inventoryRepository.countBySupplierId(s.getId());
        return SupplierResponse.builder()
                .id(s.getId())
                .supplierName(s.getSupplierName())
                .contactPerson(s.getContactPerson())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .status(s.getStatus() != null ? s.getStatus().name() : "ACTIVE")
                .suppliedItemsCount(count)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private InventoryResponse toInventoryResponse(Inventory i) {
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

    private void validateSupplierRequest(SupplierRequest request, Long currentId) {
        if (request.getSupplierName() == null || request.getSupplierName().trim().length() < 2) {
            throw new BusinessRuleException("Supplier company name must be at least 2 characters long.");
        }
        if (request.getPhone() == null || !PHONE_PATTERN.matcher(request.getPhone().trim()).matches()) {
            throw new BusinessRuleException("Valid phone number is required (at least 7 digits).");
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (!request.getEmail().contains("@") || !request.getEmail().contains(".")) {
                throw new BusinessRuleException("Invalid email address format.");
            }
        }

        String trimmedName = request.getSupplierName().trim();
        if (currentId == null) {
            if (supplierRepository.existsBySupplierName(trimmedName)) {
                throw new BusinessRuleException("Supplier with name '" + trimmedName + "' already exists.");
            }
        } else {
            if (supplierRepository.existsBySupplierNameAndIdNot(trimmedName, currentId)) {
                throw new BusinessRuleException("Supplier with name '" + trimmedName + "' already exists.");
            }
        }
    }

    public Page<SupplierResponse> getAllSuppliers(String search, SupplierStatus status, Pageable pageable) {
        return supplierRepository.filterSuppliers(search, status, pageable).map(this::toResponse);
    }

    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        return toResponse(supplier);
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        validateSupplierRequest(request, null);

        Supplier supplier = Supplier.builder()
                .supplierName(request.getSupplierName().trim())
                .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null)
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .status(request.getStatus() != null ? request.getStatus() : SupplierStatus.ACTIVE)
                .build();

        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));

        validateSupplierRequest(request, id);

        supplier.setSupplierName(request.getSupplierName().trim());
        if (request.getContactPerson() != null) supplier.setContactPerson(request.getContactPerson().trim());
        if (request.getPhone() != null) supplier.setPhone(request.getPhone().trim());
        if (request.getEmail() != null) supplier.setEmail(request.getEmail().trim());
        if (request.getAddress() != null) supplier.setAddress(request.getAddress().trim());
        if (request.getStatus() != null) supplier.setStatus(request.getStatus());

        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse activateSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        supplier.setStatus(SupplierStatus.ACTIVE);
        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse deactivateSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        supplier.setStatus(SupplierStatus.INACTIVE);
        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse toggleStatus(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        supplier.setStatus(supplier.getStatus() == SupplierStatus.ACTIVE ? SupplierStatus.INACTIVE : SupplierStatus.ACTIVE);
        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public void deleteSupplier(Long id, boolean force) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));

        long count = inventoryRepository.countBySupplierId(id);
        if (count > 0 && !force) {
            throw new BusinessRuleException("Cannot delete supplier '" + supplier.getSupplierName() +
                    "' because it is currently associated with " + count + " inventory items. " +
                    "Please disassociate the items or deactivate the supplier instead.");
        }

        if (count > 0 && force) {
            List<Inventory> items = inventoryRepository.findBySupplierId(id);
            for (Inventory item : items) {
                item.setSupplier(null);
                inventoryRepository.save(item);
            }
        }

        supplierRepository.delete(supplier);
    }

    public List<InventoryResponse> getSuppliedItems(Long supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Supplier", supplierId);
        }
        return inventoryRepository.findBySupplierId(supplierId).stream()
                .map(this::toInventoryResponse)
                .toList();
    }

    @Transactional
    public List<InventoryResponse> associateItems(Long supplierId, List<Long> inventoryItemIds) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", supplierId));

        if (inventoryItemIds != null && !inventoryItemIds.isEmpty()) {
            for (Long itemId : inventoryItemIds) {
                Inventory item = inventoryRepository.findById(itemId)
                        .orElseThrow(() -> new ResourceNotFoundException("Inventory", itemId));
                item.setSupplier(supplier);
                inventoryRepository.save(item);
            }
        }

        return getSuppliedItems(supplierId);
    }

    @Transactional
    public void disassociateItem(Long supplierId, Long inventoryId) {
        Inventory item = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", inventoryId));

        if (item.getSupplier() != null && item.getSupplier().getId().equals(supplierId)) {
            item.setSupplier(null);
            inventoryRepository.save(item);
        }
    }
}
