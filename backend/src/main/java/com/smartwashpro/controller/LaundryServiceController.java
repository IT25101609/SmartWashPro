package com.smartwashpro.controller;

import com.smartwashpro.dto.request.ServiceRequest;
import com.smartwashpro.dto.response.ServiceResponse;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.LaundryService;
import com.smartwashpro.repository.LaundryServiceRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
public class LaundryServiceController {

    private final LaundryServiceRepository laundryServiceRepository;

    public LaundryServiceController(LaundryServiceRepository laundryServiceRepository) {
        this.laundryServiceRepository = laundryServiceRepository;
    }

    private ServiceResponse toResponse(LaundryService s) {
        return ServiceResponse.builder()
                .id(s.getId())
                .serviceName(s.getServiceName())
                .category(s.getCategory())
                .description(s.getDescription())
                .price(s.getPrice() != null ? BigDecimal.valueOf(s.getPrice()) : null)
                .pricingType(s.getPricingType() != null ? s.getPricingType().name() : null)
                .available(s.getAvailable())
                .createdAt(s.getCreatedAt())
                .build();
    }

    @GetMapping
    public ResponseEntity<List<ServiceResponse>> getAllServices() {
        List<ServiceResponse> list = laundryServiceRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/available")
    public ResponseEntity<List<ServiceResponse>> getAvailableServices() {
        List<ServiceResponse> list = laundryServiceRepository.findByAvailableTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceResponse> getServiceById(@PathVariable Long id) {
        LaundryService service = laundryServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LaundryService", id));
        return ResponseEntity.ok(toResponse(service));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<ServiceResponse> createService(@Valid @RequestBody ServiceRequest request) {
        LaundryService service = LaundryService.builder()
                .serviceName(request.getServiceName())
                .category(request.getCategory())
                .description(request.getDescription())
                .price(request.getPrice() != null ? request.getPrice().doubleValue() : 0.0)
                .pricingType(request.getPricingType())
                .available(request.getAvailable() != null ? request.getAvailable() : true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(laundryServiceRepository.save(service)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<ServiceResponse> updateService(@PathVariable Long id, @RequestBody ServiceRequest request) {
        LaundryService service = laundryServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LaundryService", id));
        if (request.getServiceName() != null) service.setServiceName(request.getServiceName());
        if (request.getCategory() != null) service.setCategory(request.getCategory());
        if (request.getDescription() != null) service.setDescription(request.getDescription());
        if (request.getPrice() != null) service.setPrice(request.getPrice().doubleValue());
        if (request.getPricingType() != null) service.setPricingType(request.getPricingType());
        if (request.getAvailable() != null) service.setAvailable(request.getAvailable());
        return ResponseEntity.ok(toResponse(laundryServiceRepository.save(service)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        LaundryService service = laundryServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LaundryService", id));
        service.setAvailable(false);
        laundryServiceRepository.save(service);
        return ResponseEntity.noContent().build();
    }
}
