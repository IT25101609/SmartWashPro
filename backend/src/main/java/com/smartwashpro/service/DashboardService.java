package com.smartwashpro.service;

import com.smartwashpro.dto.response.*;
import com.smartwashpro.model.enums.OrderStatus;
import com.smartwashpro.model.enums.PaymentStatus;
import com.smartwashpro.repository.*;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.*;

@Service
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryRepository inventoryRepository;
    private final EquipmentRepository equipmentRepository;
    private final ComplaintRepository complaintRepository;
    private final FeedbackRepository feedbackRepository;
    private final EmployeeTaskRepository taskRepository;
    private final PickupRepository pickupRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    public DashboardService(CustomerRepository customerRepository,
                            EmployeeRepository employeeRepository,
                            OrderRepository orderRepository,
                            PaymentRepository paymentRepository,
                            InventoryRepository inventoryRepository,
                            EquipmentRepository equipmentRepository,
                            ComplaintRepository complaintRepository,
                            FeedbackRepository feedbackRepository,
                            EmployeeTaskRepository taskRepository,
                            PickupRepository pickupRepository,
                            DeliveryRepository deliveryRepository,
                            UserRepository userRepository,
                            OrderService orderService,
                            SecurityUtils securityUtils) {
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.inventoryRepository = inventoryRepository;
        this.equipmentRepository = equipmentRepository;
        this.complaintRepository = complaintRepository;
        this.feedbackRepository = feedbackRepository;
        this.taskRepository = taskRepository;
        this.pickupRepository = pickupRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
        this.securityUtils = securityUtils;
    }

    public DashboardResponse getManagerDashboard() {
        Long branchId = securityUtils.isAdmin() ? null : securityUtils.getCurrentUserBranchId();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(23, 59, 59);

        long totalCustomers;
        long totalEmployees;
        long totalOrders;
        long todayOrders;
        long pendingOrders;
        long processingOrders;
        long completedOrders;
        Double totalRevenue;
        Double todayRevenue;
        long pendingPayments;
        Double pendingPaymentsAmount;
        long pendingPickups;
        long todayPickups;
        long pendingDeliveries;
        long todayDeliveries;
        long lowStockItems;
        long openComplaints;
        long brokenEquipment;
        long equipmentMaintenance;
        List<OrderResponse> recentOrders;
        List<InventoryResponse> lowStockAlerts;
        List<EquipmentResponse> maintenanceAlerts;

        if (branchId != null) {
            totalOrders = orderRepository.countByBranchId(branchId);
            todayOrders = orderRepository.filterOrders(branchId, null, todayStart, todayEnd, null, PageRequest.of(0, 1)).getTotalElements();
            pendingOrders = orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.PLACED)
                    + orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.RECEIVED)
                    + orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.ASSIGNED);
            processingOrders = orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.PROCESSING)
                    + orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.IN_WASH)
                    + orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.READY)
                    + orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.OUT_FOR_DELIVERY);
            completedOrders = orderRepository.countByBranchIdAndOrderStatus(branchId, OrderStatus.DELIVERED);

            totalRevenue = orderRepository.getTotalRevenueByBranch(branchId);
            if (totalRevenue == null) totalRevenue = 0.0;

            todayRevenue = paymentRepository.filterPayments(null, PaymentStatus.PAID, null, branchId, null, PageRequest.of(0, 1000)).getContent().stream()
                    .filter(p -> {
                        LocalDateTime dt = p.getPaymentDate() != null ? p.getPaymentDate() : p.getCreatedAt();
                        return dt != null && !dt.isBefore(todayStart) && !dt.isAfter(todayEnd);
                    })
                    .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();

            pendingPayments = paymentRepository.filterPayments(null, PaymentStatus.PENDING, null, branchId, null, PageRequest.of(0, 1)).getTotalElements();
            pendingPaymentsAmount = paymentRepository.filterPayments(null, PaymentStatus.PENDING, null, branchId, null, PageRequest.of(0, 1000)).getContent().stream()
                    .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();

            totalEmployees = employeeRepository.findAll().stream().filter(e -> Objects.equals(e.getBranchId(), branchId)).count();
            totalCustomers = orderRepository.filterOrders(branchId, null, null, null, null, PageRequest.of(0, 1000)).getContent().stream()
                    .map(o -> o.getCustomer() != null ? o.getCustomer().getId() : null).filter(Objects::nonNull).distinct().count();

            pendingPickups = pickupRepository.filterPickups(null, branchId, null, null, null, null, PageRequest.of(0, 1000)).getContent().stream()
                    .filter(p -> p.getPickupStatus() != com.smartwashpro.model.enums.PickupStatus.COMPLETED && p.getPickupStatus() != com.smartwashpro.model.enums.PickupStatus.CANCELLED).count();
            todayPickups = pickupRepository.filterPickups(null, branchId, null, null, LocalDate.now(), null, PageRequest.of(0, 1000)).getTotalElements();

            pendingDeliveries = deliveryRepository.filterDeliveries(null, branchId, null, null, null, null, PageRequest.of(0, 1000)).getContent().stream()
                    .filter(d -> d.getDeliveryStatus() != com.smartwashpro.model.enums.DeliveryStatus.DELIVERED && d.getDeliveryStatus() != com.smartwashpro.model.enums.DeliveryStatus.CANCELLED).count();
            todayDeliveries = deliveryRepository.filterDeliveries(null, branchId, null, null, null, null, PageRequest.of(0, 1000)).getContent().stream()
                    .filter(d -> LocalDate.now().equals(d.getDeliveryDate())).count();

            lowStockItems = inventoryRepository.findLowStockItems().stream().filter(i -> Objects.equals(i.getBranchId(), branchId)).count();
            brokenEquipment = equipmentRepository.findByStatus(com.smartwashpro.model.enums.EquipmentStatus.BROKEN).stream().filter(e -> Objects.equals(e.getBranchId(), branchId)).count();
            equipmentMaintenance = equipmentRepository.findByNextMaintenanceDateBefore(LocalDate.now().plusDays(7)).stream().filter(e -> Objects.equals(e.getBranchId(), branchId)).count();

            openComplaints = complaintRepository.findAll().stream().filter(c -> (c.getStatus() == com.smartwashpro.model.enums.ComplaintStatus.OPEN || c.getStatus() == com.smartwashpro.model.enums.ComplaintStatus.IN_PROGRESS) && ((c.getOrder() != null && Objects.equals(c.getOrder().getBranchId(), branchId)) || (c.getAssignedEmployee() != null && Objects.equals(c.getAssignedEmployee().getBranchId(), branchId)))).count();

            recentOrders = orderRepository.filterOrders(branchId, null, null, null, null,
                    PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
            ).getContent().stream().map(o -> orderService.getOrderById(o.getId(), "system")).toList();

            lowStockAlerts = inventoryRepository.findLowStockItems().stream()
                    .filter(i -> Objects.equals(i.getBranchId(), branchId))
                    .map(i -> InventoryResponse.builder()
                            .id(i.getId()).itemName(i.getItemName()).quantity(i.getQuantity())
                            .minimumStockLevel(i.getMinimumStockLevel()).unit(i.getUnit())
                            .lowStock(true).build()).toList();

            maintenanceAlerts = equipmentRepository.findByNextMaintenanceDateBefore(LocalDate.now().plusDays(7))
                    .stream()
                    .filter(e -> Objects.equals(e.getBranchId(), branchId))
                    .map(e -> EquipmentResponse.builder()
                            .id(e.getId()).equipmentName(e.getEquipmentName())
                            .status(e.getStatus().name()).nextMaintenanceDate(e.getNextMaintenanceDate()).build()).toList();
        } else {
            totalCustomers = customerRepository.count();
            totalEmployees = employeeRepository.count();
            totalOrders = orderRepository.count();
            todayOrders = orderRepository.countOrdersBetween(todayStart, todayEnd);
            pendingOrders = orderRepository.countByOrderStatus(OrderStatus.PLACED)
                    + orderRepository.countByOrderStatus(OrderStatus.RECEIVED)
                    + orderRepository.countByOrderStatus(OrderStatus.ASSIGNED);
            processingOrders = orderRepository.countByOrderStatus(OrderStatus.PROCESSING)
                    + orderRepository.countByOrderStatus(OrderStatus.IN_WASH)
                    + orderRepository.countByOrderStatus(OrderStatus.READY)
                    + orderRepository.countByOrderStatus(OrderStatus.OUT_FOR_DELIVERY);
            completedOrders = orderRepository.countByOrderStatus(OrderStatus.DELIVERED);

            totalRevenue = paymentRepository.getTotalRevenue();
            if (totalRevenue == null) totalRevenue = 0.0;
            todayRevenue = paymentRepository.getRevenueBetween(todayStart, todayEnd);
            if (todayRevenue == null) todayRevenue = 0.0;

            pendingPayments = paymentRepository.countByPaymentStatus(PaymentStatus.PENDING);
            pendingPaymentsAmount = paymentRepository.getPendingPaymentsAmount();
            if (pendingPaymentsAmount == null) pendingPaymentsAmount = 0.0;

            pendingPickups = pickupRepository.countPendingPickups();
            todayPickups = pickupRepository.countTodayPickups(LocalDate.now());

            pendingDeliveries = deliveryRepository.countPendingDeliveries();
            todayDeliveries = deliveryRepository.countTodayDeliveries(LocalDate.now());

            lowStockItems = inventoryRepository.findLowStockItems().size();
            openComplaints = complaintRepository.countOpenComplaints();
            brokenEquipment = equipmentRepository.countByStatus(com.smartwashpro.model.enums.EquipmentStatus.BROKEN);
            equipmentMaintenance = equipmentRepository.findByNextMaintenanceDateBefore(LocalDate.now().plusDays(7)).size();

            recentOrders = orderRepository.findAll(
                    PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
            ).getContent().stream().map(o -> orderService.getOrderById(o.getId(), "system")).toList();

            lowStockAlerts = inventoryRepository.findLowStockItems().stream()
                    .map(i -> InventoryResponse.builder()
                            .id(i.getId()).itemName(i.getItemName()).quantity(i.getQuantity())
                            .minimumStockLevel(i.getMinimumStockLevel()).unit(i.getUnit())
                            .lowStock(true).build()).toList();

            maintenanceAlerts = equipmentRepository.findByNextMaintenanceDateBefore(LocalDate.now().plusDays(7))
                    .stream().map(e -> EquipmentResponse.builder()
                            .id(e.getId()).equipmentName(e.getEquipmentName())
                            .status(e.getStatus().name()).nextMaintenanceDate(e.getNextMaintenanceDate()).build()).toList();
        }

        Double avgRating;
        if (branchId != null) {
            avgRating = feedbackRepository.findAll().stream()
                    .filter(f -> f.getStatus() == com.smartwashpro.model.enums.FeedbackStatus.PUBLISHED && f.getOrder() != null && Objects.equals(f.getOrder().getBranchId(), branchId))
                    .mapToInt(com.smartwashpro.model.Feedback::getRating).average().orElse(0.0);
        } else {
            avgRating = feedbackRepository.getAverageRating();
            if (avgRating == null) avgRating = 0.0;
        }

        // Monthly orders and revenue chart data (last 6 months from database)
        List<Map<String, Object>> monthlyOrders = new ArrayList<>();
        List<Map<String, Object>> monthlyRevenue = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i);
            String monthName = month.getMonth().name().substring(0, 3);
            LocalDateTime start = month.withDayOfMonth(1).atStartOfDay();
            LocalDateTime end = month.withDayOfMonth(month.lengthOfMonth()).atTime(23, 59, 59);

            long count;
            Double rev;
            if (branchId != null) {
                count = orderRepository.filterOrders(branchId, null, start, end, null, PageRequest.of(0, 1)).getTotalElements();
                rev = paymentRepository.filterPayments(null, PaymentStatus.PAID, null, branchId, null, PageRequest.of(0, 1000)).getContent().stream()
                        .filter(p -> {
                            LocalDateTime dt = p.getPaymentDate() != null ? p.getPaymentDate() : p.getCreatedAt();
                            return dt != null && !dt.isBefore(start) && !dt.isAfter(end);
                        })
                        .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
            } else {
                count = orderRepository.countOrdersBetween(start, end);
                rev = paymentRepository.getRevenueBetween(start, end);
                if (rev == null) rev = 0.0;
            }

            Map<String, Object> mo = new HashMap<>();
            mo.put("month", monthName);
            mo.put("count", count);
            monthlyOrders.add(mo);

            Map<String, Object> mr = new HashMap<>();
            mr.put("month", monthName);
            mr.put("amount", rev);
            mr.put("revenue", rev);
            monthlyRevenue.add(mr);
        }

        // Real order status distribution from database
        List<Map<String, Object>> statusDist = new ArrayList<>();
        if (branchId != null) {
            for (OrderStatus os : OrderStatus.values()) {
                long c = orderRepository.countByBranchIdAndOrderStatus(branchId, os);
                if (c > 0) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("status", os.name());
                    m.put("count", c);
                    statusDist.add(m);
                }
            }
        } else {
            for (Object[] row : orderRepository.getOrderStatusDistribution()) {
                if (row != null && row.length >= 2 && row[0] != null) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("status", row[0].toString());
                    m.put("count", row[1]);
                    statusDist.add(m);
                }
            }
        }

        return DashboardResponse.builder()
                .totalCustomers(totalCustomers)
                .totalEmployees(totalEmployees)
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .pendingOrders(pendingOrders)
                .processingOrders(processingOrders)
                .completedOrders(completedOrders)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .pendingPayments(pendingPayments)
                .pendingPaymentsCount(pendingPayments)
                .pendingPaymentsAmount(pendingPaymentsAmount)
                .pendingPickups(pendingPickups)
                .todayPickups(todayPickups)
                .pendingDeliveries(pendingDeliveries)
                .todayDeliveries(todayDeliveries)
                .lowStockItems(lowStockItems)
                .equipmentNeedingMaintenance(equipmentMaintenance)
                .brokenEquipment(brokenEquipment)
                .openComplaints(openComplaints)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .monthlyOrders(monthlyOrders)
                .monthlyRevenue(monthlyRevenue)
                .orderStatusDistribution(statusDist)
                .recentOrders(recentOrders)
                .lowStockAlerts(lowStockAlerts)
                .maintenanceAlerts(maintenanceAlerts)
                .build();
    }

    public DashboardResponse getCustomerDashboard(String email) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var customer = customerRepository.findByUserId(user.getId()).orElseThrow();
        var allCustOrders = orderRepository.findByCustomerId(customer.getId(), PageRequest.of(0, 100)).getContent();
        long activeOrders = allCustOrders.stream()
                .filter(o -> o.getOrderStatus() != OrderStatus.DELIVERED && o.getOrderStatus() != OrderStatus.CANCELLED).count();
        long completedOrders = allCustOrders.stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED).count();
        long pendingPayments = paymentRepository.findByCustomerId(customer.getId(), PageRequest.of(0, 100))
                .stream().filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING).count();
        List<OrderResponse> recentOrders = orderRepository.findRecentByCustomerId(customer.getId(), PageRequest.of(0, 10))
                .stream().map(o -> orderService.getOrderById(o.getId(), email)).toList();
        long totalOrdersCount = customer.getTotalOrders() != null && customer.getTotalOrders() > 0 
                ? customer.getTotalOrders() 
                : allCustOrders.size();
        Double totalSpentVal = customer.getTotalSpent() != null ? customer.getTotalSpent() : 0.0;
        Integer loyaltyPts = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;

        return DashboardResponse.builder()
                .totalOrders(totalOrdersCount)
                .completedOrders(completedOrders)
                .activeOrders(activeOrders)
                .pendingPayments(pendingPayments)
                .loyaltyPoints(loyaltyPts)
                .totalSpent(totalSpentVal)
                .myRecentOrders(recentOrders)
                .build();
    }

    public DashboardResponse getFinanceDashboard() {
        Double totalRevenue = paymentRepository.getTotalRevenue();
        if (totalRevenue == null) totalRevenue = 0.0;
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        Double todayRevenue = paymentRepository.getRevenueFrom(todayStart);
        if (todayRevenue == null) todayRevenue = 0.0;
        long paidCount = paymentRepository.countByPaymentStatus(PaymentStatus.PAID);
        long pendingCount = paymentRepository.countByPaymentStatus(PaymentStatus.PENDING);
        List<Map<String, Object>> methodBreakdown = new ArrayList<>();
        for (Map<String, Object> row : paymentRepository.getRevenueByPaymentMethod()) {
            Map<String, Object> m = new HashMap<>();
            m.put("method", row.get("method") != null ? row.get("method").toString() : "CASH");
            m.put("amount", row.get("amount"));
            methodBreakdown.add(m);
        }
        return DashboardResponse.builder()
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .paidPayments(paidCount)
                .pendingPaymentsCount(pendingCount)
                .paymentMethodBreakdown(methodBreakdown)
                .build();
    }

    public DashboardResponse getReceptionistDashboard() {
        long pendingOrders = orderRepository.countByOrderStatus(OrderStatus.PLACED);
        long totalOrders = orderRepository.count();
        long pendingPaymentsCount = paymentRepository.countByPaymentStatus(PaymentStatus.PENDING);

        return DashboardResponse.builder()
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .pendingPaymentsCount(pendingPaymentsCount)
                .build();
    }

    public DashboardResponse getStaffDashboard(String email) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var employee = employeeRepository.findByUserId(user.getId()).orElseThrow();
        long pending = taskRepository.countByEmployeeIdAndTaskStatus(employee.getId(), com.smartwashpro.model.enums.TaskStatus.PENDING);
        long completed = taskRepository.countByEmployeeIdAndTaskStatus(employee.getId(), com.smartwashpro.model.enums.TaskStatus.COMPLETED);

        return DashboardResponse.builder()
                .myPendingTasks(pending)
                .myCompletedTasks(completed)
                .build();
    }

    public DashboardResponse getDriverDashboard(String email) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var employee = employeeRepository.findByUserId(user.getId()).orElseThrow();
        long pickups = pickupRepository.findByDriverId(employee.getId(), PageRequest.of(0, 100)).getTotalElements();
        long deliveries = deliveryRepository.findByDriverId(employee.getId(), PageRequest.of(0, 100)).getTotalElements();

        return DashboardResponse.builder()
                .todayPickups(pickups)
                .todayDeliveries(deliveries)
                .build();
    }
}
