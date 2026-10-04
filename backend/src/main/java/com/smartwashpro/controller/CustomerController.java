package com.smartwashpro.controller;

import com.smartwashpro.dto.request.CustomerUpdateRequest;
import com.smartwashpro.dto.response.CustomerResponse;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Customer;
import com.smartwashpro.model.enums.UserStatus;
import com.smartwashpro.repository.CustomerRepository;
import com.smartwashpro.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public CustomerController(CustomerRepository customerRepository, UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    private CustomerResponse toResponse(Customer c) {
        var u = c.getUser();
        return CustomerResponse.builder()
                .id(c.getId()).userId(u.getId())
                .fullName(u.getFullName()).email(u.getEmail())
                .phoneNumber(u.getPhoneNumber()).address(u.getAddress())
                .status(u.getStatus().name())
                .loyaltyPoints(c.getLoyaltyPoints())
                .totalOrders(c.getTotalOrders())
                .totalSpent(c.getTotalSpent())
                .preferredPaymentMethod(c.getPreferredPaymentMethod() != null ? c.getPreferredPaymentMethod().name() : null)
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<Page<CustomerResponse>> getAll(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Customer> page = search != null && !search.isBlank()
                ? customerRepository.searchCustomers(search, pageable)
                : customerRepository.findAll(pageable);
        return ResponseEntity.ok(page.map(this::toResponse));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN', 'CUSTOMER')")
    public ResponseEntity<CustomerResponse> getById(@PathVariable Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        return ResponseEntity.ok(toResponse(c));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<CustomerResponse> updateCustomer(@PathVariable Long id, @RequestBody CustomerUpdateRequest request) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        
        var u = c.getUser();
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            u.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null) {
            u.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAddress() != null) {
            u.setAddress(request.getAddress());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                u.setStatus(UserStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (Exception ignored) {}
        }
        userRepository.save(u);

        if (request.getLoyaltyPoints() != null) {
            c.setLoyaltyPoints(request.getLoyaltyPoints());
            customerRepository.save(c);
        }

        return ResponseEntity.ok(toResponse(c));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<CustomerResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        c.getUser().setStatus(UserStatus.valueOf(body.get("status")));
        userRepository.save(c.getUser());
        return ResponseEntity.ok(toResponse(c));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        
        // Soft delete user by setting status to BLOCKED
        c.getUser().setStatus(UserStatus.BLOCKED);
        userRepository.save(c.getUser());
        return ResponseEntity.noContent().build();
    }
}
