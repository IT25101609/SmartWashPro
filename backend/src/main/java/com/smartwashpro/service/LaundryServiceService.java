package com.smartwashpro.service;

import com.smartwashpro.dto.request.ServiceRequest;
import com.smartwashpro.dto.response.ServiceResponse;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.LaundryService;
import com.smartwashpro.model.enums.PricingType;
import com.smartwashpro.repository.LaundryServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LaundryServiceService {
    private final LaundryServiceRepository laundryServiceRepository;

    public LaundryServiceService(LaundryServiceRepository laundryServiceRepository) {
        this.laundryServiceRepository = laundryServiceRepository;
    }

    public List<ServiceResponse> getAllServices() {
        return laundryServiceRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    public List<ServiceResponse> getAvailableServices() {
        return laundryServiceRepository.findByAvailableTrue().stream().map(this::mapToResponse).toList();
    }

    public ServiceResponse getServiceById(Long id) {
        LaundryService service = laundryServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laundry Service", id));
        return mapToResponse(service);
    }

    @Transactional
    public ServiceResponse createService(ServiceRequest request) {
        LaundryService service = LaundryService.builder()
                .serviceName(request.getServiceName())
                .category(request.getCategory())
                .description(request.getDescription())
                .price(request.getPrice() != null ? request.getPrice().doubleValue() : 0.0)
                .pricingType(request.getPricingType() != null ? request.getPricingType() : PricingType.PER_KG)
                .available(request.getAvailable() != null ? request.getAvailable() : true)
                .build();

        service = laundryServiceRepository.save(service);
        return mapToResponse(service);
    }

    @Transactional
    public ServiceResponse updateService(Long id, ServiceRequest request) {
        LaundryService service = laundryServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laundry Service", id));

        service.setServiceName(request.getServiceName());
        service.setCategory(request.getCategory());
        service.setDescription(request.getDescription());
        if (request.getPrice() != null) {
            service.setPrice(request.getPrice().doubleValue());
        }
        if (request.getPricingType() != null) {
            service.setPricingType(request.getPricingType());
        }
        if (request.getAvailable() != null) {
            service.setAvailable(request.getAvailable());
        }

        service = laundryServiceRepository.save(service);
        return mapToResponse(service);
    }

    @Transactional
    public void deleteService(Long id) {
        if (!laundryServiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Laundry Service", id);
        }
        laundryServiceRepository.deleteById(id);
    }

    private ServiceResponse mapToResponse(LaundryService service) {
        return ServiceResponse.builder()
                .id(service.getId())
                .serviceName(service.getServiceName())
                .category(service.getCategory())
                .description(service.getDescription())
                .price(service.getPrice() != null ? BigDecimal.valueOf(service.getPrice()) : BigDecimal.ZERO)
                .pricingType(service.getPricingType() != null ? service.getPricingType().name() : "PER_KG")
                .available(service.getAvailable() != null ? service.getAvailable() : true)
                .build();
    }
}
