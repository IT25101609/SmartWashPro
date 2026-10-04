package com.smartwashpro.service;

import com.smartwashpro.dto.response.DashboardResponse;
import com.smartwashpro.dto.response.ReportDataResponse;
import com.smartwashpro.model.*;
import com.smartwashpro.model.enums.*;
import com.smartwashpro.repository.*;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final DashboardService dashboardService;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final InventoryRepository inventoryRepository;
    private final LaundryServiceRepository laundryServiceRepository;
    private final AttendanceRepository attendanceRepository;
    private final PickupRepository pickupRepository;
    private final DeliveryRepository deliveryRepository;
    private final ComplaintRepository complaintRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public ReportService(DashboardService dashboardService,
                         OrderRepository orderRepository,
                         PaymentRepository paymentRepository,
                         CustomerRepository customerRepository,
                         EmployeeRepository employeeRepository,
                         InventoryRepository inventoryRepository,
                         LaundryServiceRepository laundryServiceRepository,
                         AttendanceRepository attendanceRepository,
                         PickupRepository pickupRepository,
                         DeliveryRepository deliveryRepository,
                         ComplaintRepository complaintRepository,
                         BranchRepository branchRepository,
                         SecurityUtils securityUtils) {
        this.dashboardService = dashboardService;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.inventoryRepository = inventoryRepository;
        this.laundryServiceRepository = laundryServiceRepository;
        this.attendanceRepository = attendanceRepository;
        this.pickupRepository = pickupRepository;
        this.deliveryRepository = deliveryRepository;
        this.complaintRepository = complaintRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    public DashboardResponse getManagerReport() {
        return dashboardService.getManagerDashboard();
    }

    public DashboardResponse getFinanceReport() {
        return dashboardService.getFinanceDashboard();
    }

    /**
     * Metadata for populating filter dropdowns dynamically.
     */
    public Map<String, Object> getFiltersMetadata() {
        Map<String, Object> meta = new HashMap<>();

        // Branches
        List<Map<String, Object>> branches;
        if (securityUtils.isAdmin()) {
            branches = branchRepository.findAll().stream().map(b -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", b.getId());
                m.put("name", b.getBranchName());
                m.put("code", b.getBranchCode());
                return m;
            }).toList();
        } else {
            Long userBranchId = securityUtils.getCurrentUserBranchId();
            branches = branchRepository.findAll().stream()
                    .filter(b -> Objects.equals(b.getId(), userBranchId))
                    .map(b -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", b.getId());
                        m.put("name", b.getBranchName());
                        m.put("code", b.getBranchCode());
                        return m;
                    }).toList();
        }
        meta.put("branches", branches);

        // Employees
        Long userBranchId = securityUtils.getCurrentUserBranchId();
        List<Map<String, Object>> employees = employeeRepository.findAll().stream()
                .filter(e -> securityUtils.isAdmin() || Objects.equals(e.getBranchId(), userBranchId))
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", e.getId());
                    m.put("name", e.getUser() != null ? e.getUser().getFullName() : "Employee #" + e.getId());
                    m.put("role", e.getRole());
                    m.put("branchId", e.getBranchId());
                    return m;
                }).toList();
        meta.put("employees", employees);

        // Services
        List<Map<String, Object>> services = laundryServiceRepository.findAll().stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getServiceName());
            m.put("category", s.getCategory());
            m.put("price", s.getPrice());
            return m;
        }).toList();
        meta.put("services", services);

        // Status lists
        meta.put("orderStatuses", Arrays.stream(OrderStatus.values()).map(Enum::name).toList());
        meta.put("paymentStatuses", Arrays.stream(PaymentStatus.values()).map(Enum::name).toList());
        meta.put("attendanceStatuses", Arrays.stream(AttendanceStatus.values()).map(Enum::name).toList());
        meta.put("pickupStatuses", Arrays.stream(PickupStatus.values()).map(Enum::name).toList());
        meta.put("deliveryStatuses", Arrays.stream(DeliveryStatus.values()).map(Enum::name).toList());
        meta.put("complaintStatuses", Arrays.stream(ComplaintStatus.values()).map(Enum::name).toList());
        meta.put("inventoryCategories", Arrays.stream(InventoryCategory.values()).map(Enum::name).toList());

        return meta;
    }

    /**
     * Master report generation method handling all 12 reports with the 6 filters.
     */
    public ReportDataResponse generateReport(String type,
                                             LocalDate startDate,
                                             LocalDate endDate,
                                             Long branchId,
                                             String status,
                                             Long employeeId,
                                             Long serviceId) {
        String normalizedType = (type != null ? type.trim().toUpperCase() : "DAILY_ORDERS")
                .replace("-", "_").replace(" ", "_");

        LocalDate effStartDate = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate effEndDate = endDate != null ? endDate : LocalDate.now();

        Long effBranchId = branchId;
        if (!securityUtils.isAdmin()) {
            effBranchId = securityUtils.getCurrentUserBranchId();
        }

        Map<String, Object> filterState = new HashMap<>();
        filterState.put("startDate", effStartDate.toString());
        filterState.put("endDate", effEndDate.toString());
        filterState.put("branchId", effBranchId);
        filterState.put("status", status);
        filterState.put("employeeId", employeeId);
        filterState.put("serviceId", serviceId);

        ReportDataResponse resp = new ReportDataResponse();
        resp.setReportType(normalizedType);
        resp.setFilters(filterState);

        switch (normalizedType) {
            case "DAILY_ORDERS":
                buildDailyOrdersReport(resp, effStartDate, effEndDate, effBranchId, status, serviceId);
                break;
            case "MONTHLY_ORDERS":
                buildMonthlyOrdersReport(resp, effStartDate, effEndDate, effBranchId, status);
                break;
            case "REVENUE":
                buildRevenueReport(resp, effStartDate, effEndDate, effBranchId, status);
                break;
            case "PAYMENTS":
                buildPaymentsReport(resp, effStartDate, effEndDate, effBranchId, status);
                break;
            case "INVENTORY":
                buildInventoryReport(resp, status, effBranchId);
                break;
            case "LOW_STOCK":
                buildLowStockReport(resp, status, effBranchId);
                break;
            case "CUSTOMERS":
                buildCustomersReport(resp, effStartDate, effEndDate, effBranchId);
                break;
            case "SERVICES":
                buildServicesReport(resp, effStartDate, effEndDate, serviceId, effBranchId);
                break;
            case "EMPLOYEE_ATTENDANCE":
            case "ATTENDANCE":
                buildAttendanceReport(resp, effStartDate, effEndDate, effBranchId, employeeId, status);
                break;
            case "PICKUPS":
                buildPickupsReport(resp, effStartDate, effEndDate, effBranchId, employeeId, status);
                break;
            case "DELIVERIES":
                buildDeliveriesReport(resp, effStartDate, effEndDate, effBranchId, employeeId, status);
                break;
            case "COMPLAINTS":
                buildComplaintsReport(resp, effStartDate, effEndDate, status, employeeId, effBranchId);
                break;
            default:
                buildDailyOrdersReport(resp, effStartDate, effEndDate, effBranchId, status, serviceId);
                break;
        }

        return resp;
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 1. DAILY ORDERS REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildDailyOrdersReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId, String status, Long serviceId) {
        resp.setTitle("Daily Orders Analysis");
        resp.setDescription("Comprehensive day-by-day batch flow, intake volumes, and generated order amounts.");

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> {
                    LocalDate d = o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate() : (o.getOrderDate() != null ? o.getOrderDate().toLocalDate() : null);
                    if (d == null || d.isBefore(startDate) || d.isAfter(endDate)) return false;
                    if (branchId != null && !Objects.equals(o.getBranchId(), branchId)) return false;
                    if (status != null && !status.equalsIgnoreCase("ALL") && !o.getOrderStatus().name().equalsIgnoreCase(status)) return false;
                    if (serviceId != null) {
                        boolean match = o.getItems().stream().anyMatch(i -> i.getLaundryService() != null && Objects.equals(i.getLaundryService().getId(), serviceId));
                        if (!match) return false;
                    }
                    return true;
                }).sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))).toList();

        // Group by Date for chart
        Map<LocalDate, List<Order>> byDate = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate() : (o.getOrderDate() != null ? o.getOrderDate().toLocalDate() : LocalDate.now())));

        List<Map<String, Object>> chart = new ArrayList<>();
        LocalDate cur = startDate;
        while (!cur.isAfter(endDate)) {
            List<Order> dayOrders = byDate.getOrDefault(cur, Collections.emptyList());
            double dayRev = dayOrders.stream().mapToDouble(o -> o.getTotalPrice() != null ? o.getTotalPrice() : 0.0).sum();
            Map<String, Object> pt = new HashMap<>();
            pt.put("date", cur.toString());
            pt.put("orders", dayOrders.size());
            pt.put("revenue", dayRev);
            chart.add(pt);
            cur = cur.plusDays(1);
        }
        resp.setChartData(chart);

        // Columns definition
        List<Map<String, String>> cols = List.of(
                Map.of("key", "orderId", "label", "Order #"),
                Map.of("key", "date", "label", "Intake Date"),
                Map.of("key", "customer", "label", "Customer"),
                Map.of("key", "itemsCount", "label", "Items / Weight"),
                Map.of("key", "totalPrice", "label", "Total Price (Rs.)"),
                Map.of("key", "status", "label", "Status"),
                Map.of("key", "branch", "label", "Branch")
        );
        resp.setColumns(cols);

        // Records
        List<Map<String, Object>> records = orders.stream().map(o -> {
            Map<String, Object> r = new HashMap<>();
            r.put("orderId", "#" + o.getId());
            r.put("date", o.getCreatedAt() != null ? o.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "-");
            r.put("customer", o.getCustomer() != null && o.getCustomer().getUser() != null ? o.getCustomer().getUser().getFullName() : "Walk-in");
            r.put("itemsCount", o.getItems() != null ? o.getItems().size() + " items (" + (o.getTotalWeight() != null ? o.getTotalWeight() + " kg" : "N/A") + ")" : "-");
            r.put("totalPrice", o.getTotalPrice() != null ? String.format("%.2f", o.getTotalPrice()) : "0.00");
            r.put("status", o.getOrderStatus().name());
            r.put("branch", o.getBranchId() != null ? "Branch #" + o.getBranchId() : "Main Branch");
            return r;
        }).toList();
        resp.setRecords(records);

        // Summary
        double totalRev = orders.stream().mapToDouble(o -> o.getTotalPrice() != null ? o.getTotalPrice() : 0.0).sum();
        long delivered = orders.stream().filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED).count();
        long pending = orders.stream().filter(o -> o.getOrderStatus() == OrderStatus.PLACED || o.getOrderStatus() == OrderStatus.RECEIVED).count();
        long daysDiff = Math.max(1, Duration.between(startDate.atStartOfDay(), endDate.atTime(23, 59, 59)).toDays() + 1);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOrders", orders.size());
        summary.put("totalRevenue", totalRev);
        summary.put("avgDailyOrders", Math.round(((double) orders.size() / daysDiff) * 10.0) / 10.0);
        summary.put("deliveredOrders", delivered);
        summary.put("pendingOrders", pending);
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 2. MONTHLY ORDERS REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildMonthlyOrdersReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId, String status) {
        resp.setTitle("Monthly Orders & Volume Trends");
        resp.setDescription("Aggregate monthly volume, completion velocities, and monthly invoiced amounts.");

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> {
                    LocalDate d = o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate() : (o.getOrderDate() != null ? o.getOrderDate().toLocalDate() : null);
                    if (d == null || d.isBefore(startDate) || d.isAfter(endDate)) return false;
                    if (branchId != null && !Objects.equals(o.getBranchId(), branchId)) return false;
                    if (status != null && !status.equalsIgnoreCase("ALL") && !o.getOrderStatus().name().equalsIgnoreCase(status)) return false;
                    return true;
                }).toList();

        Map<YearMonth, List<Order>> byMonth = orders.stream().collect(Collectors.groupingBy(o -> {
            LocalDate d = o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate() : o.getOrderDate().toLocalDate();
            return YearMonth.from(d);
        }));

        List<YearMonth> sortedMonths = byMonth.keySet().stream().sorted().toList();
        List<Map<String, Object>> chart = new ArrayList<>();
        List<Map<String, Object>> records = new ArrayList<>();

        for (YearMonth ym : sortedMonths) {
            List<Order> mOrders = byMonth.get(ym);
            double rev = mOrders.stream().mapToDouble(o -> o.getTotalPrice() != null ? o.getTotalPrice() : 0.0).sum();
            long comp = mOrders.stream().filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED).count();
            long canc = mOrders.stream().filter(o -> o.getOrderStatus() == OrderStatus.CANCELLED).count();

            Map<String, Object> pt = new HashMap<>();
            pt.put("month", ym.getMonth().name().substring(0, 3) + " " + ym.getYear());
            pt.put("orders", mOrders.size());
            pt.put("revenue", rev);
            chart.add(pt);

            Map<String, Object> r = new HashMap<>();
            r.put("monthYear", ym.toString());
            r.put("monthName", ym.getMonth().name() + " " + ym.getYear());
            r.put("orderCount", mOrders.size());
            r.put("totalRevenue", String.format("%.2f", rev));
            r.put("deliveredCount", comp);
            r.put("cancelledCount", canc);
            r.put("avgOrderValue", mOrders.size() > 0 ? String.format("%.2f", rev / mOrders.size()) : "0.00");
            records.add(r);
        }
        resp.setChartData(chart);
        resp.setRecords(records);

        resp.setColumns(List.of(
                Map.of("key", "monthName", "label", "Month & Year"),
                Map.of("key", "orderCount", "label", "Total Batches"),
                Map.of("key", "totalRevenue", "label", "Gross Value (Rs.)"),
                Map.of("key", "deliveredCount", "label", "Delivered"),
                Map.of("key", "cancelledCount", "label", "Cancelled"),
                Map.of("key", "avgOrderValue", "label", "Avg Value / Order (Rs.)")
        ));

        double totalRev = orders.stream().mapToDouble(o -> o.getTotalPrice() != null ? o.getTotalPrice() : 0.0).sum();
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOrders", orders.size());
        summary.put("totalRevenue", totalRev);
        summary.put("monthsCovered", sortedMonths.size());
        summary.put("avgMonthlyRevenue", sortedMonths.size() > 0 ? Math.round(totalRev / sortedMonths.size()) : 0.0);
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 3. REVENUE REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildRevenueReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId, String status) {
        resp.setTitle("Revenue & Financial Realization");
        resp.setDescription("Realized income, pending settlement queues, and payment instrument performance.");

        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> {
                    LocalDate d = p.getPaymentDate() != null ? p.getPaymentDate().toLocalDate() : (p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate() : null);
                    if (d == null || d.isBefore(startDate) || d.isAfter(endDate)) return false;
                    if (branchId != null && p.getOrder() != null && !Objects.equals(p.getOrder().getBranchId(), branchId)) return false;
                    if (status != null && !status.equalsIgnoreCase("ALL") && !p.getPaymentStatus().name().equalsIgnoreCase(status)) return false;
                    return true;
                }).sorted(Comparator.comparing(Payment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))).toList();

        // Chart by day
        Map<LocalDate, Double> revByDate = new TreeMap<>();
        Map<PaymentMethod, Double> revByMethod = new EnumMap<>(PaymentMethod.class);
        double grossPaid = 0.0;
        double grossPending = 0.0;

        for (Payment p : payments) {
            double amt = p.getAmount() != null ? p.getAmount() : 0.0;
            if (p.getPaymentStatus() == PaymentStatus.PAID) {
                grossPaid += amt;
                LocalDate d = p.getPaymentDate() != null ? p.getPaymentDate().toLocalDate() : p.getCreatedAt().toLocalDate();
                revByDate.put(d, revByDate.getOrDefault(d, 0.0) + amt);
                revByMethod.put(p.getPaymentMethod(), revByMethod.getOrDefault(p.getPaymentMethod(), 0.0) + amt);
            } else if (p.getPaymentStatus() == PaymentStatus.PENDING) {
                grossPending += amt;
            }
        }

        List<Map<String, Object>> chart = new ArrayList<>();
        for (Map.Entry<LocalDate, Double> e : revByDate.entrySet()) {
            Map<String, Object> pt = new HashMap<>();
            pt.put("date", e.getKey().toString());
            pt.put("revenue", e.getValue());
            chart.add(pt);
        }
        resp.setChartData(chart);

        resp.setColumns(List.of(
                Map.of("key", "receiptNumber", "label", "Receipt #"),
                Map.of("key", "orderId", "label", "Order #"),
                Map.of("key", "customer", "label", "Customer"),
                Map.of("key", "amount", "label", "Amount (Rs.)"),
                Map.of("key", "method", "label", "Payment Instrument"),
                Map.of("key", "status", "label", "Settlement Status"),
                Map.of("key", "date", "label", "Settled Date")
        ));

        List<Map<String, Object>> records = payments.stream().map(p -> {
            Map<String, Object> r = new HashMap<>();
            r.put("receiptNumber", p.getReceiptNumber() != null ? p.getReceiptNumber() : "RCP-PENDING");
            r.put("orderId", p.getOrder() != null ? "#" + p.getOrder().getId() : "-");
            r.put("customer", p.getCustomer() != null && p.getCustomer().getUser() != null ? p.getCustomer().getUser().getFullName() : "Customer");
            r.put("amount", p.getAmount() != null ? String.format("%.2f", p.getAmount()) : "0.00");
            r.put("method", p.getPaymentMethod().name().replace("_", " "));
            r.put("status", p.getPaymentStatus().name());
            r.put("date", p.getPaymentDate() != null ? p.getPaymentDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : (p.getCreatedAt() != null ? p.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "-"));
            return r;
        }).toList();
        resp.setRecords(records);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSettledRevenue", grossPaid);
        summary.put("totalPendingRevenue", grossPending);
        summary.put("totalPaymentsRecorded", payments.size());
        summary.put("avgSettledTicket", payments.size() > 0 ? Math.round((grossPaid / payments.size()) * 10.0) / 10.0 : 0.0);
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 4. PAYMENTS REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildPaymentsReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId, String status) {
        resp.setTitle("Payments & Settlements Audit");
        resp.setDescription("Audit of all transactions, payment gateway references, and customer receipts.");

        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> {
                    LocalDate d = p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate() : null;
                    if (d == null || d.isBefore(startDate) || d.isAfter(endDate)) return false;
                    if (branchId != null && p.getOrder() != null && !Objects.equals(p.getOrder().getBranchId(), branchId)) return false;
                    if (status != null && !status.equalsIgnoreCase("ALL") && !p.getPaymentStatus().name().equalsIgnoreCase(status)) return false;
                    return true;
                }).sorted(Comparator.comparing(Payment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))).toList();

        resp.setColumns(List.of(
                Map.of("key", "receiptNumber", "label", "Receipt #"),
                Map.of("key", "orderId", "label", "Order #"),
                Map.of("key", "customer", "label", "Customer"),
                Map.of("key", "amount", "label", "Amount (Rs.)"),
                Map.of("key", "method", "label", "Method"),
                Map.of("key", "status", "label", "Payment Status"),
                Map.of("key", "reference", "label", "Transaction Ref"),
                Map.of("key", "date", "label", "Date Created")
        ));

        List<Map<String, Object>> records = payments.stream().map(p -> {
            Map<String, Object> r = new HashMap<>();
            r.put("receiptNumber", p.getReceiptNumber() != null ? p.getReceiptNumber() : "—");
            r.put("orderId", p.getOrder() != null ? "#" + p.getOrder().getId() : "—");
            r.put("customer", p.getCustomer() != null && p.getCustomer().getUser() != null ? p.getCustomer().getUser().getFullName() : "Customer");
            r.put("amount", p.getAmount() != null ? String.format("%.2f", p.getAmount()) : "0.00");
            r.put("method", p.getPaymentMethod().name().replace("_", " "));
            r.put("status", p.getPaymentStatus().name());
            r.put("reference", p.getTransactionReference() != null ? p.getTransactionReference() : "N/A");
            r.put("date", p.getCreatedAt() != null ? p.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "—");
            return r;
        }).toList();
        resp.setRecords(records);

        long paid = payments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.PAID).count();
        long pending = payments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING).count();
        double paidAmt = payments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.PAID).mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
        double pendingAmt = payments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING).mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();

        List<Map<String, Object>> chart = List.of(
                Map.of("name", "Paid", "count", paid, "value", paidAmt),
                Map.of("name", "Pending", "count", pending, "value", pendingAmt)
        );
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalTransactions", payments.size());
        summary.put("paidTransactions", paid);
        summary.put("pendingTransactions", pending);
        summary.put("totalSettledAmount", paidAmt);
        summary.put("totalPendingAmount", pendingAmt);
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 5. INVENTORY REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildInventoryReport(ReportDataResponse resp, String categoryFilter, Long branchId) {
        resp.setTitle("Inventory & Capital Asset Valuation");
        resp.setDescription("Stock level telemetry, raw material reserves, SKU valuation, and replenishment risk.");

        List<Inventory> items = inventoryRepository.findAll().stream()
                .filter(i -> {
                    if (categoryFilter != null && !categoryFilter.equalsIgnoreCase("ALL") && !i.getCategory().name().equalsIgnoreCase(categoryFilter)) return false;
                    if (branchId != null && !Objects.equals(i.getBranchId(), branchId)) return false;
                    return true;
                }).sorted(Comparator.comparing(Inventory::getItemName)).toList();

        resp.setColumns(List.of(
                Map.of("key", "itemName", "label", "Item Description"),
                Map.of("key", "category", "label", "Category"),
                Map.of("key", "quantity", "label", "Quantity on Hand"),
                Map.of("key", "minLevel", "label", "Min Threshold"),
                Map.of("key", "unitCost", "label", "Unit Cost (Rs.)"),
                Map.of("key", "totalValue", "label", "Asset Value (Rs.)"),
                Map.of("key", "status", "label", "Stock Health"),
                Map.of("key", "supplier", "label", "Supplier")
        ));

        double totalVal = 0.0;
        int lowCount = 0;
        Map<String, Double> valByCategory = new HashMap<>();

        List<Map<String, Object>> records = new ArrayList<>();
        for (Inventory i : items) {
            double qty = i.getQuantity() != null ? i.getQuantity() : 0.0;
            double cost = i.getUnitCost() != null ? i.getUnitCost().doubleValue() : 0.0;
            double min = i.getMinimumStockLevel() != null ? i.getMinimumStockLevel() : 0.0;
            double val = qty * cost;
            totalVal += val;

            boolean isLow = qty <= min;
            if (isLow) lowCount++;

            String cat = i.getCategory() != null ? i.getCategory().name() : "OTHER";
            valByCategory.put(cat, valByCategory.getOrDefault(cat, 0.0) + val);

            Map<String, Object> r = new HashMap<>();
            r.put("itemName", i.getItemName());
            r.put("category", cat.replace("_", " "));
            r.put("quantity", qty + " " + (i.getUnit() != null ? i.getUnit() : ""));
            r.put("minLevel", min + " " + (i.getUnit() != null ? i.getUnit() : ""));
            r.put("unitCost", String.format("%.2f", cost));
            r.put("totalValue", String.format("%.2f", val));
            r.put("status", isLow ? "LOW STOCK" : "OPTIMAL");
            r.put("supplier", i.getSupplier() != null ? i.getSupplier().getSupplierName() : "Standard Supplier");
            records.add(r);
        }
        resp.setRecords(records);

        List<Map<String, Object>> chart = new ArrayList<>();
        for (Map.Entry<String, Double> e : valByCategory.entrySet()) {
            Map<String, Object> pt = new HashMap<>();
            pt.put("category", e.getKey().replace("_", " "));
            pt.put("value", Math.round(e.getValue()));
            chart.add(pt);
        }
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSKUs", items.size());
        summary.put("totalCapitalValuation", totalVal);
        summary.put("lowStockItemsCount", lowCount);
        summary.put("healthyStockCount", items.size() - lowCount);
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 6. LOW STOCK REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildLowStockReport(ReportDataResponse resp, String categoryFilter, Long branchId) {
        resp.setTitle("Critical Low Stock & Reorder Shortfall");
        resp.setDescription("Actionable restock alert matrix detailing minimum stock deficits and supplier purchase orders.");

        List<Inventory> lowItems = inventoryRepository.findLowStockItems().stream()
                .filter(i -> {
                    if (categoryFilter != null && !categoryFilter.equalsIgnoreCase("ALL") && !i.getCategory().name().equalsIgnoreCase(categoryFilter)) return false;
                    if (branchId != null && !Objects.equals(i.getBranchId(), branchId)) return false;
                    return true;
                }).sorted(Comparator.comparing(Inventory::getQuantity)).toList();

        resp.setColumns(List.of(
                Map.of("key", "itemName", "label", "Item Description"),
                Map.of("key", "category", "label", "Category"),
                Map.of("key", "quantity", "label", "Current Stock"),
                Map.of("key", "minLevel", "label", "Required Min"),
                Map.of("key", "deficit", "label", "Deficit Shortfall"),
                Map.of("key", "reorderCost", "label", "Est. Restock Budget (Rs.)"),
                Map.of("key", "supplier", "label", "Primary Supplier"),
                Map.of("key", "contact", "label", "Supplier Phone")
        ));

        double totalDeficitCost = 0.0;
        List<Map<String, Object>> records = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();

        for (Inventory i : lowItems) {
            double qty = i.getQuantity() != null ? i.getQuantity() : 0.0;
            double min = i.getMinimumStockLevel() != null ? i.getMinimumStockLevel() : 0.0;
            double cost = i.getUnitCost() != null ? i.getUnitCost().doubleValue() : 0.0;
            double def = Math.max(0.0, min - qty);
            double reorderBudget = def * cost;
            totalDeficitCost += reorderBudget;

            Map<String, Object> r = new HashMap<>();
            r.put("itemName", i.getItemName());
            r.put("category", i.getCategory().name().replace("_", " "));
            r.put("quantity", qty + " " + (i.getUnit() != null ? i.getUnit() : ""));
            r.put("minLevel", min + " " + (i.getUnit() != null ? i.getUnit() : ""));
            r.put("deficit", def + " " + (i.getUnit() != null ? i.getUnit() : ""));
            r.put("reorderCost", String.format("%.2f", reorderBudget));
            r.put("supplier", i.getSupplier() != null ? i.getSupplier().getSupplierName() : "Approved Vendor");
            r.put("contact", i.getSupplier() != null && i.getSupplier().getPhone() != null ? i.getSupplier().getPhone() : "Direct Order");
            records.add(r);

            Map<String, Object> pt = new HashMap<>();
            pt.put("item", i.getItemName());
            pt.put("deficit", def);
            pt.put("cost", reorderBudget);
            chart.add(pt);
        }
        resp.setRecords(records);
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("criticalSKUsCount", lowItems.size());
        summary.put("estimatedRestockBudget", totalDeficitCost);
        summary.put("actionRequired", lowItems.size() > 0 ? "URGENT PURCHASE REQUISITION" : "ALL STOCK OPTIMAL");
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 7. CUSTOMERS REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildCustomersReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId) {
        resp.setTitle("Customer Portfolio & Lifetime Value");
        resp.setDescription("Client acquisition, repeat order frequencies, and aggregated spend analytics.");

        List<Customer> customers;
        if (branchId != null) {
            Set<Long> branchCustomerIds = orderRepository.findAll().stream()
                    .filter(o -> Objects.equals(o.getBranchId(), branchId) && o.getCustomer() != null)
                    .map(o -> o.getCustomer().getId())
                    .collect(Collectors.toSet());
            customers = customerRepository.findAll().stream()
                    .filter(c -> branchCustomerIds.contains(c.getId()))
                    .sorted(Comparator.comparing(Customer::getTotalSpent, Comparator.nullsLast(Comparator.reverseOrder()))).toList();
        } else {
            customers = customerRepository.findAll().stream()
                    .sorted(Comparator.comparing(Customer::getTotalSpent, Comparator.nullsLast(Comparator.reverseOrder()))).toList();
        }

        resp.setColumns(List.of(
                Map.of("key", "customer", "label", "Customer Name"),
                Map.of("key", "email", "label", "Email"),
                Map.of("key", "phone", "label", "Phone Number"),
                Map.of("key", "totalOrders", "label", "Total Batches"),
                Map.of("key", "totalSpent", "label", "Lifetime Spend (Rs.)"),
                Map.of("key", "loyaltyPoints", "label", "Loyalty Points"),
                Map.of("key", "prefMethod", "label", "Preferred Payment"),
                Map.of("key", "joined", "label", "Member Since")
        ));

        double totalSpendAll = 0.0;
        int totalBatchesAll = 0;
        List<Map<String, Object>> records = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();

        for (Customer c : customers) {
            double spent = c.getTotalSpent() != null ? c.getTotalSpent() : 0.0;
            int orders = c.getTotalOrders() != null ? c.getTotalOrders() : 0;
            totalSpendAll += spent;
            totalBatchesAll += orders;

            String name = c.getUser() != null ? c.getUser().getFullName() : "Customer #" + c.getId();
            Map<String, Object> r = new HashMap<>();
            r.put("customer", name);
            r.put("email", c.getUser() != null ? c.getUser().getEmail() : "—");
            r.put("phone", c.getUser() != null && c.getUser().getPhoneNumber() != null ? c.getUser().getPhoneNumber() : "—");
            r.put("totalOrders", orders);
            r.put("totalSpent", String.format("%.2f", spent));
            r.put("loyaltyPoints", c.getLoyaltyPoints() != null ? c.getLoyaltyPoints() : 0);
            r.put("prefMethod", c.getPreferredPaymentMethod() != null ? c.getPreferredPaymentMethod().name().replace("_", " ") : "CASH");
            r.put("joined", c.getUser() != null && c.getUser().getCreatedAt() != null ? c.getUser().getCreatedAt().toLocalDate().toString() : "—");
            records.add(r);
        }
        resp.setRecords(records);

        // Chart: Top 10 Customers by spend
        for (int i = 0; i < Math.min(8, customers.size()); i++) {
            Customer c = customers.get(i);
            Map<String, Object> pt = new HashMap<>();
            pt.put("customer", c.getUser() != null ? c.getUser().getFullName() : "Client #" + c.getId());
            pt.put("spent", c.getTotalSpent() != null ? c.getTotalSpent() : 0.0);
            chart.add(pt);
        }
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRegisteredCustomers", customers.size());
        summary.put("totalCustomerSpend", totalSpendAll);
        summary.put("totalOrdersPlaced", totalBatchesAll);
        summary.put("avgCustomerLifetimeValue", customers.size() > 0 ? Math.round((totalSpendAll / customers.size()) * 10.0) / 10.0 : 0.0);
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 8. SERVICES REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildServicesReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long serviceId, Long branchId) {
        resp.setTitle("Laundry Services Performance & Demand");
        resp.setDescription("Service catalogue usage, volume units processed, and service-level revenue contributions.");

        List<LaundryService> services = laundryServiceRepository.findAll().stream()
                .filter(s -> serviceId == null || Objects.equals(s.getId(), serviceId)).toList();

        // Calculate usage from all orders
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> {
                    LocalDate d = o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate() : null;
                    if (d == null || d.isBefore(startDate) || d.isAfter(endDate)) return false;
                    if (branchId != null && !Objects.equals(o.getBranchId(), branchId)) return false;
                    return true;
                }).toList();

        Map<Long, Integer> usageCount = new HashMap<>();
        Map<Long, Double> volumeCount = new HashMap<>();
        Map<Long, Double> revCount = new HashMap<>();

        for (Order o : orders) {
            for (OrderItem item : o.getItems()) {
                if (item.getLaundryService() != null) {
                    Long sId = item.getLaundryService().getId();
                    usageCount.put(sId, usageCount.getOrDefault(sId, 0) + 1);
                    volumeCount.put(sId, volumeCount.getOrDefault(sId, 0.0) + (item.getQuantity() != null ? item.getQuantity() : 1.0));
                    revCount.put(sId, revCount.getOrDefault(sId, 0.0) + (item.getSubtotal() != null ? item.getSubtotal() : 0.0));
                }
            }
        }

        resp.setColumns(List.of(
                Map.of("key", "serviceName", "label", "Service Name"),
                Map.of("key", "category", "label", "Category"),
                Map.of("key", "price", "label", "Unit Price (Rs.)"),
                Map.of("key", "pricingType", "label", "Pricing Model"),
                Map.of("key", "timesOrdered", "label", "Orders Count"),
                Map.of("key", "totalVolume", "label", "Units Processed"),
                Map.of("key", "totalRevenue", "label", "Generated Revenue (Rs.)"),
                Map.of("key", "status", "label", "Availability")
        ));

        double totalServiceRev = 0.0;
        List<Map<String, Object>> records = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();

        for (LaundryService s : services) {
            int used = usageCount.getOrDefault(s.getId(), 0);
            double vol = volumeCount.getOrDefault(s.getId(), 0.0);
            double rev = revCount.getOrDefault(s.getId(), 0.0);
            totalServiceRev += rev;

            Map<String, Object> r = new HashMap<>();
            r.put("serviceName", s.getServiceName());
            r.put("category", s.getCategory() != null ? s.getCategory() : "GENERAL");
            r.put("price", String.format("%.2f", s.getPrice() != null ? s.getPrice() : 0.0));
            r.put("pricingType", s.getPricingType() != null ? s.getPricingType().name().replace("_", " ") : "FIXED");
            r.put("timesOrdered", used);
            r.put("totalVolume", vol + (s.getPricingType() == PricingType.PER_KG ? " kg" : " items"));
            r.put("totalRevenue", String.format("%.2f", rev));
            r.put("status", s.getAvailable() ? "ACTIVE" : "INACTIVE");
            records.add(r);

            Map<String, Object> pt = new HashMap<>();
            pt.put("service", s.getServiceName());
            pt.put("revenue", rev);
            pt.put("orders", used);
            chart.add(pt);
        }
        resp.setRecords(records);
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalServicesAvailable", services.size());
        summary.put("totalServiceRevenue", totalServiceRev);
        summary.put("activeServices", services.stream().filter(LaundryService::getAvailable).count());
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 9. EMPLOYEE ATTENDANCE REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildAttendanceReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId, Long employeeId, String status) {
        resp.setTitle("Employee Attendance & Working Hours");
        resp.setDescription("Daily staff duty rosters, shift check-ins, check-outs, and accumulated working hours.");

        AttendanceStatus statusEnum = null;
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            try { statusEnum = AttendanceStatus.valueOf(status.toUpperCase().trim()); } catch (Exception ignored) {}
        }

        List<Attendance> attendances = attendanceRepository.filterAttendance(branchId, employeeId, null, startDate, endDate, statusEnum, null, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "date"))).getContent();

        resp.setColumns(List.of(
                Map.of("key", "date", "label", "Duty Date"),
                Map.of("key", "employee", "label", "Employee Name"),
                Map.of("key", "role", "label", "Designation"),
                Map.of("key", "checkIn", "label", "Check In"),
                Map.of("key", "checkOut", "label", "Check Out"),
                Map.of("key", "workingHours", "label", "Hours Worked"),
                Map.of("key", "status", "label", "Status")
        ));

        int present = 0;
        int late = 0;
        int absent = 0;
        int leave = 0;
        double totalHours = 0.0;
        List<Map<String, Object>> records = new ArrayList<>();

        for (Attendance a : attendances) {
            String empName = a.getEmployee() != null && a.getEmployee().getUser() != null ? a.getEmployee().getUser().getFullName() : "Employee #" + a.getEmployee().getId();
            String empRole = a.getEmployee() != null ? a.getEmployee().getRole().replace("_", " ") : "STAFF";

            double hours = 0.0;
            if (a.getCheckIn() != null && a.getCheckOut() != null) {
                long mins = Duration.between(a.getCheckIn(), a.getCheckOut()).toMinutes();
                if (mins > 0) hours = Math.round((mins / 60.0) * 10.0) / 10.0;
            }
            totalHours += hours;

            if (a.getAttendanceStatus() == AttendanceStatus.PRESENT) present++;
            else if (a.getAttendanceStatus() == AttendanceStatus.LATE) late++;
            else if (a.getAttendanceStatus() == AttendanceStatus.ABSENT) absent++;
            else if (a.getAttendanceStatus() == AttendanceStatus.LEAVE) leave++;

            Map<String, Object> r = new HashMap<>();
            r.put("date", a.getDate() != null ? a.getDate().toString() : "—");
            r.put("employee", empName);
            r.put("role", empRole);
            r.put("checkIn", a.getCheckIn() != null ? a.getCheckIn().toString() : "—");
            r.put("checkOut", a.getCheckOut() != null ? a.getCheckOut().toString() : "—");
            r.put("workingHours", hours > 0 ? hours + " hrs" : "0.0 hrs");
            r.put("status", a.getAttendanceStatus().name());
            records.add(r);
        }
        resp.setRecords(records);

        List<Map<String, Object>> chart = List.of(
                Map.of("name", "Present", "count", present),
                Map.of("name", "Late", "count", late),
                Map.of("name", "Absent", "count", absent),
                Map.of("name", "Leave", "count", leave)
        );
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRecords", attendances.size());
        summary.put("presentCount", present);
        summary.put("lateCount", late);
        summary.put("absentCount", absent);
        summary.put("leaveCount", leave);
        summary.put("totalWorkingHours", Math.round(totalHours * 10.0) / 10.0);
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 10. PICKUPS REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildPickupsReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId, Long employeeId, String status) {
        resp.setTitle("Customer Pickups Dispatch Log");
        resp.setDescription("Scheduled door-to-door laundry pickup tasks, driver dispatches, and collection statuses.");

        PickupStatus statusEnum = null;
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            try { statusEnum = PickupStatus.valueOf(status.toUpperCase().trim()); } catch (Exception ignored) {}
        }

        List<Pickup> pickups = pickupRepository.filterPickups(null, branchId, employeeId, statusEnum, null, null, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "pickupDate"))).getContent().stream()
                .filter(p -> {
                    LocalDate d = p.getPickupDate();
                    return d != null && !d.isBefore(startDate) && !d.isAfter(endDate);
                }).toList();

        resp.setColumns(List.of(
                Map.of("key", "pickupId", "label", "Pickup #"),
                Map.of("key", "orderId", "label", "Order #"),
                Map.of("key", "customer", "label", "Customer"),
                Map.of("key", "address", "label", "Pickup Address"),
                Map.of("key", "date", "label", "Scheduled Date"),
                Map.of("key", "timeSlot", "label", "Time Window"),
                Map.of("key", "driver", "label", "Assigned Driver"),
                Map.of("key", "status", "label", "Status")
        ));

        int completed = 0;
        int pending = 0;
        List<Map<String, Object>> records = new ArrayList<>();

        for (Pickup p : pickups) {
            String custName = p.getCustomer() != null && p.getCustomer().getUser() != null ? p.getCustomer().getUser().getFullName() : "Customer";
            String driverName = p.getDriver() != null && p.getDriver().getUser() != null ? p.getDriver().getUser().getFullName() : "Unassigned";

            if (p.getPickupStatus() == PickupStatus.COMPLETED || p.getPickupStatus() == PickupStatus.COLLECTED) completed++;
            else pending++;

            Map<String, Object> r = new HashMap<>();
            r.put("pickupId", "#" + p.getId());
            r.put("orderId", p.getOrder() != null ? "#" + p.getOrder().getId() : "—");
            r.put("customer", custName);
            r.put("address", p.getPickupAddress() != null ? p.getPickupAddress() : "—");
            r.put("date", p.getPickupDate() != null ? p.getPickupDate().toString() : "—");
            r.put("timeSlot", p.getPickupTimeSlot() != null ? p.getPickupTimeSlot() : "Flexible");
            r.put("driver", driverName);
            r.put("status", p.getPickupStatus().name());
            records.add(r);
        }
        resp.setRecords(records);

        List<Map<String, Object>> chart = List.of(
                Map.of("name", "Completed", "count", completed),
                Map.of("name", "Pending / Assigned", "count", pending)
        );
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPickups", pickups.size());
        summary.put("completedPickups", completed);
        summary.put("pendingPickups", pending);
        summary.put("completionRate", pickups.size() > 0 ? Math.round(((double) completed / pickups.size()) * 100) + "%" : "100%");
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 11. DELIVERIES REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildDeliveriesReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, Long branchId, Long employeeId, String status) {
        resp.setTitle("Clean Laundry Delivery Dispatch Log");
        resp.setDescription("Finished package delivery dispatches, courier routes, and delivery handover statuses.");

        DeliveryStatus statusEnum = null;
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            try { statusEnum = DeliveryStatus.valueOf(status.toUpperCase().trim()); } catch (Exception ignored) {}
        }

        List<Delivery> deliveries = deliveryRepository.filterDeliveries(null, branchId, employeeId, statusEnum, null, null, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "deliveryDate"))).getContent().stream()
                .filter(d -> {
                    LocalDate date = d.getDeliveryDate();
                    return date != null && !date.isBefore(startDate) && !date.isAfter(endDate);
                }).toList();

        resp.setColumns(List.of(
                Map.of("key", "deliveryId", "label", "Delivery #"),
                Map.of("key", "orderId", "label", "Order #"),
                Map.of("key", "customer", "label", "Customer"),
                Map.of("key", "address", "label", "Drop-Off Address"),
                Map.of("key", "date", "label", "Delivery Date"),
                Map.of("key", "driver", "label", "Assigned Driver"),
                Map.of("key", "deliveryStatus", "label", "Delivery Status"),
                Map.of("key", "paymentStatus", "label", "COD Settlement")
        ));

        int delivered = 0;
        int pending = 0;
        List<Map<String, Object>> records = new ArrayList<>();

        for (Delivery d : deliveries) {
            String custName = d.getCustomer() != null && d.getCustomer().getUser() != null ? d.getCustomer().getUser().getFullName() : "Customer";
            String driverName = d.getDriver() != null && d.getDriver().getUser() != null ? d.getDriver().getUser().getFullName() : "Unassigned";

            if (d.getDeliveryStatus() == DeliveryStatus.DELIVERED) delivered++;
            else pending++;

            Map<String, Object> r = new HashMap<>();
            r.put("deliveryId", "#" + d.getId());
            r.put("orderId", d.getOrder() != null ? "#" + d.getOrder().getId() : "—");
            r.put("customer", custName);
            r.put("address", d.getDeliveryAddress() != null ? d.getDeliveryAddress() : "—");
            r.put("date", d.getDeliveryDate() != null ? d.getDeliveryDate().toString() : "—");
            r.put("driver", driverName);
            r.put("deliveryStatus", d.getDeliveryStatus().name());
            r.put("paymentStatus", d.getPaymentStatus() != null ? d.getPaymentStatus().name() : "N/A");
            records.add(r);
        }
        resp.setRecords(records);

        List<Map<String, Object>> chart = List.of(
                Map.of("name", "Delivered", "count", delivered),
                Map.of("name", "In Queue / Transit", "count", pending)
        );
        resp.setChartData(chart);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalDeliveries", deliveries.size());
        summary.put("deliveredCount", delivered);
        summary.put("pendingDeliveries", pending);
        summary.put("deliverySuccessRate", deliveries.size() > 0 ? Math.round(((double) delivered / deliveries.size()) * 100) + "%" : "100%");
        resp.setSummary(summary);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // 12. COMPLAINTS REPORT
    // ----------------------------------------------------------------------------------------------------------------
    private void buildComplaintsReport(ReportDataResponse resp, LocalDate startDate, LocalDate endDate, String status, Long employeeId, Long branchId) {
        resp.setTitle("Customer Complaints & Grievance Resolutions");
        resp.setDescription("Audit of logged complaints, priority classifications, investigator assignments, and resolution notes.");

        List<Complaint> complaints = complaintRepository.findAll().stream()
                .filter(c -> {
                    LocalDate d = c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate() : null;
                    if (d == null || d.isBefore(startDate) || d.isAfter(endDate)) return false;
                    if (status != null && !status.equalsIgnoreCase("ALL") && !c.getStatus().name().equalsIgnoreCase(status)) return false;
                    if (employeeId != null && (c.getAssignedEmployee() == null || !Objects.equals(c.getAssignedEmployee().getId(), employeeId))) return false;
                    if (branchId != null) {
                        Long cBranch = c.getOrder() != null ? c.getOrder().getBranchId() : (c.getAssignedEmployee() != null ? c.getAssignedEmployee().getBranchId() : null);
                        if (cBranch != null && !Objects.equals(cBranch, branchId)) return false;
                    }
                    return true;
                }).sorted(Comparator.comparing(Complaint::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))).toList();

        resp.setColumns(List.of(
                Map.of("key", "complaintId", "label", "Case #"),
                Map.of("key", "customer", "label", "Customer"),
                Map.of("key", "orderId", "label", "Order #"),
                Map.of("key", "category", "label", "Category"),
                Map.of("key", "priority", "label", "Priority"),
                Map.of("key", "status", "label", "Status"),
                Map.of("key", "subject", "label", "Subject"),
                Map.of("key", "assigned", "label", "Assigned Staff"),
                Map.of("key", "resolution", "label", "Resolution Outcome")
        ));

        int open = 0;
        int inProgress = 0;
        int resolved = 0;
        int closed = 0;
        List<Map<String, Object>> records = new ArrayList<>();

        for (Complaint c : complaints) {
            String custName = c.getCustomer() != null && c.getCustomer().getUser() != null ? c.getCustomer().getUser().getFullName() : "Customer";
            String staff = c.getAssignedEmployee() != null && c.getAssignedEmployee().getUser() != null ? c.getAssignedEmployee().getUser().getFullName() : "Unassigned";

            if (c.getStatus() == ComplaintStatus.OPEN) open++;
            else if (c.getStatus() == ComplaintStatus.IN_PROGRESS) inProgress++;
            else if (c.getStatus() == ComplaintStatus.RESOLVED) resolved++;
            else if (c.getStatus() == ComplaintStatus.CLOSED) closed++;

            Map<String, Object> r = new HashMap<>();
            r.put("complaintId", "#" + c.getId());
            r.put("customer", custName);
            r.put("orderId", c.getOrder() != null ? "#" + c.getOrder().getId() : "—");
            r.put("category", c.getCategory().replace("_", " "));
            r.put("priority", c.getPriority().name());
            r.put("status", c.getStatus().name());
            r.put("subject", c.getSubject());
            r.put("assigned", staff);
            r.put("resolution", c.getResolution() != null && !c.getResolution().isBlank() ? c.getResolution() : "Under investigation");
            records.add(r);
        }
        resp.setRecords(records);

        List<Map<String, Object>> chart = List.of(
                Map.of("name", "Open", "count", open),
                Map.of("name", "In Progress", "count", inProgress),
                Map.of("name", "Resolved", "count", resolved),
                Map.of("name", "Closed", "count", closed)
        );
        resp.setChartData(chart);

        int settled = resolved + closed;
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalComplaints", complaints.size());
        summary.put("openComplaints", open + inProgress);
        summary.put("resolvedComplaints", settled);
        summary.put("resolutionRate", complaints.size() > 0 ? Math.round(((double) settled / complaints.size()) * 100) + "%" : "100%");
        resp.setSummary(summary);
    }

    /**
     * CSV Export generator.
     */
    public String exportToCsv(ReportDataResponse report) {
        StringBuilder csv = new StringBuilder();
        // Title & metadata banner
        csv.append("\"Report Title:\",\"").append(report.getTitle()).append("\"\n");
        csv.append("\"Generated At:\",\"").append(report.getGeneratedAt()).append("\"\n");
        csv.append("\"Total Records:\",\"").append(report.getTotalRecords()).append("\"\n\n");

        // Columns header
        List<Map<String, String>> cols = report.getColumns();
        if (cols != null && !cols.isEmpty()) {
            csv.append(cols.stream().map(c -> "\"" + c.get("label").replace("\"", "\"\"") + "\"")
                    .collect(Collectors.joining(","))).append("\n");

            // Rows
            if (report.getRecords() != null) {
                for (Map<String, Object> rec : report.getRecords()) {
                    List<String> rowVals = new ArrayList<>();
                    for (Map<String, String> c : cols) {
                        String k = c.get("key");
                        Object v = rec.get(k);
                        String s = v != null ? v.toString() : "";
                        rowVals.add("\"" + s.replace("\"", "\"\"") + "\"");
                    }
                    csv.append(String.join(",", rowVals)).append("\n");
                }
            }
        }

        return csv.toString();
    }
}
