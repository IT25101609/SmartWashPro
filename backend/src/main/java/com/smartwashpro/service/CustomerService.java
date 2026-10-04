package com.smartwashpro.service;

import com.smartwashpro.dto.response.CustomerResponse;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Customer;
import com.smartwashpro.model.User;
import com.smartwashpro.repository.CustomerRepository;
import com.smartwashpro.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public CustomerService(CustomerRepository customerRepository, UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    public Page<CustomerResponse> getAllCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable).map(this::mapToResponse);
    }

    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        return mapToResponse(customer);
    }

    public CustomerResponse getCustomerByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", 0L));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
        return mapToResponse(customer);
    }

    private CustomerResponse mapToResponse(Customer customer) {
        User user = customer.getUser();
        return CustomerResponse.builder()
                .id(customer.getId())
                .userId(user != null ? user.getId() : null)
                .fullName(user != null ? user.getFullName() : "")
                .email(user != null ? user.getEmail() : "")
                .phoneNumber(user != null ? user.getPhoneNumber() : "")
                .address(user != null ? user.getAddress() : "")
                .status(user != null && user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .loyaltyPoints(customer.getLoyaltyPoints())
                .totalOrders(customer.getTotalOrders())
                .totalSpent(customer.getTotalSpent())
                .preferredPaymentMethod(customer.getPreferredPaymentMethod() != null ? customer.getPreferredPaymentMethod().name() : null)
                .build();
    }
}
