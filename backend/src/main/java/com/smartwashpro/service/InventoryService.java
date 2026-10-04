package com.smartwashpro.service;

import com.smartwashpro.dto.request.InventoryRequest;
import com.smartwashpro.dto.response.InventoryResponse;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Inventory;
import com.smartwashpro.model.enums.InventoryCategory;
import com.smartwashpro.repository.InventoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    public Page<InventoryResponse> getAllInventory(Pageable pageable) {
        return inventoryRepository.findAll(pageable).map(this::mapToResponse);
    }

    public InventoryResponse getInventoryById(Long id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        return mapToResponse(inventory);
    }

    @Transactional
    public InventoryResponse createInventory(InventoryRequest request) {
        Inventory inventory = Inventory.builder()
                .itemName(request.getItemName())
                .category(request.getCategory() != null ? request.getCategory() : InventoryCategory.DETERGENT)
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .minimumStockLevel(request.getMinimumStockLevel())
                .unitCost(request.getUnitCost())
                .build();

        inventory = inventoryRepository.save(inventory);
        return mapToResponse(inventory);
    }

    @Transactional
    public InventoryResponse updateInventory(Long id, InventoryRequest request) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));

        inventory.setItemName(request.getItemName());
        if (request.getCategory() != null) {
            inventory.setCategory(request.getCategory());
        }
        inventory.setQuantity(request.getQuantity());
        inventory.setUnit(request.getUnit());
        inventory.setMinimumStockLevel(request.getMinimumStockLevel());
        inventory.setUnitCost(request.getUnitCost());

        inventory = inventoryRepository.save(inventory);
        return mapToResponse(inventory);
    }

    @Transactional
    public void deleteInventory(Long id) {
        if (!inventoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Inventory", id);
        }
        inventoryRepository.deleteById(id);
    }

    private InventoryResponse mapToResponse(Inventory inventory) {
        boolean lowStock = inventory.getQuantity() <= inventory.getMinimumStockLevel();
        return InventoryResponse.builder()
                .id(inventory.getId())
                .itemName(inventory.getItemName())
                .category(inventory.getCategory() != null ? inventory.getCategory().name() : "DETERGENT")
                .quantity(inventory.getQuantity())
                .unit(inventory.getUnit())
                .minimumStockLevel(inventory.getMinimumStockLevel())
                .supplierId(inventory.getSupplier() != null ? inventory.getSupplier().getId() : null)
                .supplierName(inventory.getSupplier() != null ? inventory.getSupplier().getSupplierName() : null)
                .unitCost(inventory.getUnitCost())
                .lowStock(lowStock)
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }
}
