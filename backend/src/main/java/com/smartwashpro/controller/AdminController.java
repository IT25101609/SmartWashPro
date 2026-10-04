package com.smartwashpro.controller;

import com.smartwashpro.dto.request.BranchManagerRequest;
import com.smartwashpro.dto.response.BranchManagerResponse;
import com.smartwashpro.dto.response.UserResponse;
import com.smartwashpro.exception.DuplicateResourceException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Order;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.OrderStatus;
import com.smartwashpro.model.enums.Role;
import com.smartwashpro.model.enums.UserStatus;
import com.smartwashpro.repository.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final EquipmentRepository equipmentRepository;
    private final InventoryRepository inventoryRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository,
                           BranchRepository branchRepository,
                           OrderRepository orderRepository,
                           CustomerRepository customerRepository,
                           EquipmentRepository equipmentRepository,
                           InventoryRepository inventoryRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.equipmentRepository = equipmentRepository;
        this.inventoryRepository = inventoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        Map<String, Object> data = new HashMap<>();

        long totalBranches = branchRepository.count();
        long totalManagers = userRepository.countByRole(Role.BRANCH_MANAGER_ADMIN);
        long totalCustomers = customerRepository.count();
        long totalOrders = orderRepository.count();
        Double totalRevenue = orderRepository.getTotalRevenue();
        long pendingOrders = orderRepository.countByOrderStatus(OrderStatus.PLACED)
                + orderRepository.countByOrderStatus(OrderStatus.RECEIVED)
                + orderRepository.countByOrderStatus(OrderStatus.ASSIGNED)
                + orderRepository.countByOrderStatus(OrderStatus.PROCESSING)
                + orderRepository.countByOrderStatus(OrderStatus.IN_WASH);
        long completedOrders = orderRepository.countByOrderStatus(OrderStatus.DELIVERED);
        long totalEquipment = equipmentRepository.count();
        long totalInventory = inventoryRepository.count();

        data.put("totalBranches", totalBranches);
        data.put("totalManagers", totalManagers);
        data.put("totalCustomers", totalCustomers);
        data.put("totalOrders", totalOrders);
        data.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        data.put("pendingOrders", pendingOrders);
        data.put("completedOrders", completedOrders);
        data.put("totalEquipment", totalEquipment);
        data.put("totalInventory", totalInventory);

        // Branch breakdown
        List<Branch> branches = branchRepository.findAll();
        List<Map<String, Object>> branchMetrics = new ArrayList<>();
        for (Branch b : branches) {
            Map<String, Object> bm = new HashMap<>();
            bm.put("id", b.getId());
            bm.put("branchName", b.getBranchName());
            bm.put("branchCode", b.getBranchCode());
            bm.put("status", b.getStatus());
            bm.put("address", b.getAddress());

            long branchOrders = orderRepository.countByBranchId(b.getId());
            Double branchRev = orderRepository.getTotalRevenueByBranch(b.getId());
            bm.put("totalOrders", branchOrders);
            bm.put("totalRevenue", branchRev != null ? branchRev : 0.0);

            // Find assigned manager
            List<User> mgrs = userRepository.findByBranchId(b.getId()).stream()
                    .filter(u -> u.getRole() == Role.BRANCH_MANAGER_ADMIN)
                    .toList();
            if (!mgrs.isEmpty()) {
                bm.put("managerName", mgrs.get(0).getFullName());
                bm.put("managerEmail", mgrs.get(0).getEmail());
            } else {
                bm.put("managerName", "Unassigned");
                bm.put("managerEmail", "-");
            }
            branchMetrics.add(bm);
        }
        data.put("branchMetrics", branchMetrics);

        // Recent orders
        List<Order> recentOrders = orderRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        List<Map<String, Object>> recentOrdersList = recentOrders.stream().map(o -> {
            Map<String, Object> om = new HashMap<>();
            om.put("id", o.getId());
            om.put("customerName", o.getCustomer() != null && o.getCustomer().getUser() != null ? o.getCustomer().getUser().getFullName() : "Unknown");
            om.put("totalPrice", o.getTotalPrice());
            om.put("orderStatus", o.getOrderStatus().name());
            om.put("createdAt", o.getCreatedAt());
            om.put("branchId", o.getBranchId());
            return om;
        }).collect(Collectors.toList());
        data.put("recentOrders", recentOrdersList);

        return ResponseEntity.ok(data);
    }

    // USERS MANAGEMENT
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.findAll(pageable);

        Page<UserResponse> dtoPage = users.map(u -> UserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .address(u.getAddress())
                .role(u.getRole().name())
                .status(u.getStatus().name())
                .branchId(u.getBranchId())
                .createdAt(u.getCreatedAt())
                .build());

        return ResponseEntity.ok(dtoPage);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        String newStatusStr = body.get("status");
        if (newStatusStr != null) {
            user.setStatus(UserStatus.valueOf(newStatusStr));
            userRepository.save(user);
        }
        return ResponseEntity.ok(UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .branchId(user.getBranchId())
                .createdAt(user.getCreatedAt())
                .build());
    }

    // BRANCH MANAGERS MANAGEMENT
    @GetMapping("/branch-managers")
    public ResponseEntity<List<BranchManagerResponse>> getBranchManagers() {
        List<User> managers = userRepository.findByRole(Role.BRANCH_MANAGER_ADMIN);
        Map<Long, Branch> branchMap = branchRepository.findAll().stream()
                .collect(Collectors.toMap(Branch::getId, b -> b));

        List<BranchManagerResponse> response = managers.stream().map(m -> {
            Branch b = m.getBranchId() != null ? branchMap.get(m.getBranchId()) : null;
            return BranchManagerResponse.builder()
                    .id(m.getId())
                    .fullName(m.getFullName())
                    .email(m.getEmail())
                    .phoneNumber(m.getPhoneNumber())
                    .address(m.getAddress())
                    .status(m.getStatus().name())
                    .branchId(m.getBranchId())
                    .branchName(b != null ? b.getBranchName() : "None")
                    .branchCode(b != null ? b.getBranchCode() : "-")
                    .createdAt(m.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/branch-managers")
    public ResponseEntity<BranchManagerResponse> createBranchManager(@Valid @RequestBody BranchManagerRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + req.getEmail());
        }
        Branch branch = branchRepository.findById(req.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", req.getBranchId()));

        String rawPassword = req.getPassword() != null && !req.getPassword().isBlank()
                ? req.getPassword() : "password123";

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phoneNumber(req.getPhoneNumber())
                .address(req.getAddress())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(Role.BRANCH_MANAGER_ADMIN)
                .status(UserStatus.ACTIVE)
                .branchId(branch.getId())
                .build();

        user = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(BranchManagerResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .status(user.getStatus().name())
                .branchId(branch.getId())
                .branchName(branch.getBranchName())
                .branchCode(branch.getBranchCode())
                .createdAt(user.getCreatedAt())
                .build());
    }

    @PutMapping("/branch-managers/{id}")
    public ResponseEntity<BranchManagerResponse> updateBranchManager(
            @PathVariable Long id,
            @RequestBody BranchManagerRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch Manager", id));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getPhoneNumber() != null) user.setPhoneNumber(req.getPhoneNumber());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (req.getBranchId() != null) {
            Branch b = branchRepository.findById(req.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch", req.getBranchId()));
            user.setBranchId(b.getId());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        user = userRepository.save(user);
        Branch b = user.getBranchId() != null ? branchRepository.findById(user.getBranchId()).orElse(null) : null;

        return ResponseEntity.ok(BranchManagerResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .status(user.getStatus().name())
                .branchId(user.getBranchId())
                .branchName(b != null ? b.getBranchName() : "None")
                .branchCode(b != null ? b.getBranchCode() : "-")
                .createdAt(user.getCreatedAt())
                .build());
    }

    @DeleteMapping("/branch-managers/{id}")
    public ResponseEntity<Void> deleteBranchManager(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch Manager", id));
        user.setStatus(UserStatus.BLOCKED);
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }
}
