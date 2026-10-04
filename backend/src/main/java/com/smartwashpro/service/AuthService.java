package com.smartwashpro.service;

import com.smartwashpro.dto.request.*;
import com.smartwashpro.dto.response.AuthResponse;
import com.smartwashpro.dto.response.UserResponse;
import com.smartwashpro.exception.DuplicateResourceException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.exception.UnauthorizedException;
import com.smartwashpro.model.Customer;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.UserStatus;
import com.smartwashpro.repository.CustomerRepository;
import com.smartwashpro.repository.UserRepository;
import com.smartwashpro.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, CustomerRepository customerRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER) // Registration strictly creates CUSTOMER accounts
                .status(UserStatus.ACTIVE)
                .branchId(null)
                .build();
        user = userRepository.save(user);
        Customer customer = Customer.builder().user(user).build();
        customerRepository.save(customer);
        String token = jwtUtil.generateToken(user, user.getId(), user.getRole().name(), user.getBranchId());
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .branchId(user.getBranchId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));
        String token = jwtUtil.generateToken(user, user.getId(), user.getRole().name(), user.getBranchId());
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .branchId(user.getBranchId())
                .build();
    }

    public UserResponse getMe(String email) {
        return getCurrentUser(email);
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", 0L));
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .branchId(user.getBranchId())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
