package com.smartwashpro.dto.response;

import java.util.List;

public class DashboardResponse {
    private Long totalCustomers;
    private Long totalEmployees;
    private Long totalOrders;
    private Long todayOrders;
    private Long pendingOrders;
    private Long processingOrders;
    private Long completedOrders;
    private Double totalRevenue;
    private Double todayRevenue;
    private Long lowStockItems;
    private Long equipmentNeedingMaintenance;
    private Long brokenEquipment;
    private Long openComplaints;
    private Double averageRating;

    private Long activeOrders;
    private Long pendingPayments;
    private Long pendingPaymentsCount;
    private Double pendingPaymentsAmount;
    private Long paidPayments;

    private Long myPendingTasks;
    private Long myCompletedTasks;
    private Long todayPickups;
    private Long pendingPickups;
    private Long todayDeliveries;
    private Long pendingDeliveries;

    private Integer loyaltyPoints;
    private Double totalSpent;

    private List<?> recentOrders;
    private List<?> lowStockAlerts;
    private List<?> maintenanceAlerts;
    private List<?> orderStatusDistribution;
    private List<?> monthlyOrders;
    private List<?> monthlyRevenue;
    private List<?> paymentMethodBreakdown;
    private List<?> myRecentOrders;

    public DashboardResponse() {}

    public Long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(Long totalCustomers) { this.totalCustomers = totalCustomers; }
    public Long getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(Long totalEmployees) { this.totalEmployees = totalEmployees; }
    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }
    public Long getTodayOrders() { return todayOrders; }
    public void setTodayOrders(Long todayOrders) { this.todayOrders = todayOrders; }
    public Long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(Long pendingOrders) { this.pendingOrders = pendingOrders; }
    public Long getProcessingOrders() { return processingOrders; }
    public void setProcessingOrders(Long processingOrders) { this.processingOrders = processingOrders; }
    public Long getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(Long completedOrders) { this.completedOrders = completedOrders; }
    public Double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(Double totalRevenue) { this.totalRevenue = totalRevenue; }
    public Double getTodayRevenue() { return todayRevenue; }
    public void setTodayRevenue(Double todayRevenue) { this.todayRevenue = todayRevenue; }
    public Long getLowStockItems() { return lowStockItems; }
    public void setLowStockItems(Long lowStockItems) { this.lowStockItems = lowStockItems; }
    public Long getEquipmentNeedingMaintenance() { return equipmentNeedingMaintenance; }
    public void setEquipmentNeedingMaintenance(Long equipmentNeedingMaintenance) { this.equipmentNeedingMaintenance = equipmentNeedingMaintenance; }
    public Long getBrokenEquipment() { return brokenEquipment; }
    public void setBrokenEquipment(Long brokenEquipment) { this.brokenEquipment = brokenEquipment; }
    public Long getOpenComplaints() { return openComplaints; }
    public void setOpenComplaints(Long openComplaints) { this.openComplaints = openComplaints; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getActiveOrders() { return activeOrders; }
    public void setActiveOrders(Long activeOrders) { this.activeOrders = activeOrders; }
    public Long getPendingPayments() { return pendingPayments; }
    public void setPendingPayments(Long pendingPayments) { this.pendingPayments = pendingPayments; }
    public Long getPendingPaymentsCount() { return pendingPaymentsCount; }
    public void setPendingPaymentsCount(Long pendingPaymentsCount) { this.pendingPaymentsCount = pendingPaymentsCount; }
    public Double getPendingPaymentsAmount() { return pendingPaymentsAmount; }
    public void setPendingPaymentsAmount(Double pendingPaymentsAmount) { this.pendingPaymentsAmount = pendingPaymentsAmount; }
    public Long getPaidPayments() { return paidPayments; }
    public void setPaidPayments(Long paidPayments) { this.paidPayments = paidPayments; }

    public Long getMyPendingTasks() { return myPendingTasks; }
    public void setMyPendingTasks(Long myPendingTasks) { this.myPendingTasks = myPendingTasks; }
    public Long getMyCompletedTasks() { return myCompletedTasks; }
    public void setMyCompletedTasks(Long myCompletedTasks) { this.myCompletedTasks = myCompletedTasks; }
    public Long getTodayPickups() { return todayPickups; }
    public void setTodayPickups(Long todayPickups) { this.todayPickups = todayPickups; }
    public Long getPendingPickups() { return pendingPickups; }
    public void setPendingPickups(Long pendingPickups) { this.pendingPickups = pendingPickups; }
    public Long getTodayDeliveries() { return todayDeliveries; }
    public void setTodayDeliveries(Long todayDeliveries) { this.todayDeliveries = todayDeliveries; }
    public Long getPendingDeliveries() { return pendingDeliveries; }
    public void setPendingDeliveries(Long pendingDeliveries) { this.pendingDeliveries = pendingDeliveries; }

    public List<?> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<?> recentOrders) { this.recentOrders = recentOrders; }
    public List<?> getLowStockAlerts() { return lowStockAlerts; }
    public void setLowStockAlerts(List<?> lowStockAlerts) { this.lowStockAlerts = lowStockAlerts; }
    public List<?> getMaintenanceAlerts() { return maintenanceAlerts; }
    public void setMaintenanceAlerts(List<?> maintenanceAlerts) { this.maintenanceAlerts = maintenanceAlerts; }
    public List<?> getOrderStatusDistribution() { return orderStatusDistribution; }
    public void setOrderStatusDistribution(List<?> orderStatusDistribution) { this.orderStatusDistribution = orderStatusDistribution; }
    public List<?> getMonthlyOrders() { return monthlyOrders; }
    public void setMonthlyOrders(List<?> monthlyOrders) { this.monthlyOrders = monthlyOrders; }
    public List<?> getMonthlyRevenue() { return monthlyRevenue; }
    public void setMonthlyRevenue(List<?> monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; }
    public List<?> getPaymentMethodBreakdown() { return paymentMethodBreakdown; }
    public void setPaymentMethodBreakdown(List<?> paymentMethodBreakdown) { this.paymentMethodBreakdown = paymentMethodBreakdown; }
    public List<?> getMyRecentOrders() { return myRecentOrders; }
    public void setMyRecentOrders(List<?> myRecentOrders) { this.myRecentOrders = myRecentOrders; }

    public Integer getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
    public Double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(Double totalSpent) { this.totalSpent = totalSpent; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long totalCustomers;
        private Long totalEmployees;
        private Long totalOrders;
        private Long todayOrders;
        private Long pendingOrders;
        private Long processingOrders;
        private Long completedOrders;
        private Double totalRevenue;
        private Double todayRevenue;
        private Long lowStockItems;
        private Long equipmentNeedingMaintenance;
        private Long brokenEquipment;
        private Long openComplaints;
        private Double averageRating;
        private Long activeOrders;
        private Long pendingPayments;
        private Long pendingPaymentsCount;
        private Double pendingPaymentsAmount;
        private Long paidPayments;
        private Long myPendingTasks;
        private Long myCompletedTasks;
        private Long todayPickups;
        private Long pendingPickups;
        private Long todayDeliveries;
        private Long pendingDeliveries;
        private Integer loyaltyPoints;
        private Double totalSpent;
        private List<?> recentOrders;
        private List<?> lowStockAlerts;
        private List<?> maintenanceAlerts;
        private List<?> orderStatusDistribution;
        private List<?> monthlyOrders;
        private List<?> monthlyRevenue;
        private List<?> paymentMethodBreakdown;
        private List<?> myRecentOrders;

        public Builder totalCustomers(Long totalCustomers) { this.totalCustomers = totalCustomers; return this; }
        public Builder totalEmployees(Long totalEmployees) { this.totalEmployees = totalEmployees; return this; }
        public Builder totalOrders(Long totalOrders) { this.totalOrders = totalOrders; return this; }
        public Builder todayOrders(Long todayOrders) { this.todayOrders = todayOrders; return this; }
        public Builder pendingOrders(Long pendingOrders) { this.pendingOrders = pendingOrders; return this; }
        public Builder processingOrders(Long processingOrders) { this.processingOrders = processingOrders; return this; }
        public Builder completedOrders(Long completedOrders) { this.completedOrders = completedOrders; return this; }
        public Builder totalRevenue(Double totalRevenue) { this.totalRevenue = totalRevenue; return this; }
        public Builder todayRevenue(Double todayRevenue) { this.todayRevenue = todayRevenue; return this; }
        public Builder lowStockItems(Long lowStockItems) { this.lowStockItems = lowStockItems; return this; }
        public Builder equipmentNeedingMaintenance(Long equipmentNeedingMaintenance) { this.equipmentNeedingMaintenance = equipmentNeedingMaintenance; return this; }
        public Builder brokenEquipment(Long brokenEquipment) { this.brokenEquipment = brokenEquipment; return this; }
        public Builder openComplaints(Long openComplaints) { this.openComplaints = openComplaints; return this; }
        public Builder averageRating(Double averageRating) { this.averageRating = averageRating; return this; }

        public Builder activeOrders(Long activeOrders) { this.activeOrders = activeOrders; return this; }
        public Builder pendingPayments(Long pendingPayments) { this.pendingPayments = pendingPayments; return this; }
        public Builder pendingPaymentsCount(Long pendingPaymentsCount) { this.pendingPaymentsCount = pendingPaymentsCount; return this; }
        public Builder pendingPaymentsAmount(Double pendingPaymentsAmount) { this.pendingPaymentsAmount = pendingPaymentsAmount; return this; }
        public Builder paidPayments(Long paidPayments) { this.paidPayments = paidPayments; return this; }

        public Builder myPendingTasks(Long myPendingTasks) { this.myPendingTasks = myPendingTasks; return this; }
        public Builder myCompletedTasks(Long myCompletedTasks) { this.myCompletedTasks = myCompletedTasks; return this; }
        public Builder todayPickups(Long todayPickups) { this.todayPickups = todayPickups; return this; }
        public Builder pendingPickups(Long pendingPickups) { this.pendingPickups = pendingPickups; return this; }
        public Builder todayDeliveries(Long todayDeliveries) { this.todayDeliveries = todayDeliveries; return this; }
        public Builder pendingDeliveries(Long pendingDeliveries) { this.pendingDeliveries = pendingDeliveries; return this; }
        public Builder loyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; return this; }
        public Builder totalSpent(Double totalSpent) { this.totalSpent = totalSpent; return this; }

        public Builder recentOrders(List<?> recentOrders) { this.recentOrders = recentOrders; return this; }
        public Builder lowStockAlerts(List<?> lowStockAlerts) { this.lowStockAlerts = lowStockAlerts; return this; }
        public Builder maintenanceAlerts(List<?> maintenanceAlerts) { this.maintenanceAlerts = maintenanceAlerts; return this; }
        public Builder orderStatusDistribution(List<?> orderStatusDistribution) { this.orderStatusDistribution = orderStatusDistribution; return this; }
        public Builder monthlyOrders(List<?> monthlyOrders) { this.monthlyOrders = monthlyOrders; return this; }
        public Builder monthlyRevenue(List<?> monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; return this; }
        public Builder paymentMethodBreakdown(List<?> paymentMethodBreakdown) { this.paymentMethodBreakdown = paymentMethodBreakdown; return this; }
        public Builder myRecentOrders(List<?> myRecentOrders) { this.myRecentOrders = myRecentOrders; return this; }

        public DashboardResponse build() {
            DashboardResponse resp = new DashboardResponse();
            resp.setTotalCustomers(totalCustomers);
            resp.setTotalEmployees(totalEmployees);
            resp.setTotalOrders(totalOrders);
            resp.setTodayOrders(todayOrders);
            resp.setPendingOrders(pendingOrders);
            resp.setProcessingOrders(processingOrders);
            resp.setCompletedOrders(completedOrders);
            resp.setTotalRevenue(totalRevenue);
            resp.setTodayRevenue(todayRevenue);
            resp.setLowStockItems(lowStockItems);
            resp.setEquipmentNeedingMaintenance(equipmentNeedingMaintenance);
            resp.setBrokenEquipment(brokenEquipment);
            resp.setOpenComplaints(openComplaints);
            resp.setAverageRating(averageRating);
            resp.setActiveOrders(activeOrders);
            resp.setPendingPayments(pendingPayments);
            resp.setPendingPaymentsCount(pendingPaymentsCount);
            resp.setPendingPaymentsAmount(pendingPaymentsAmount);
            resp.setPaidPayments(paidPayments);
            resp.setMyPendingTasks(myPendingTasks);
            resp.setMyCompletedTasks(myCompletedTasks);
            resp.setTodayPickups(todayPickups);
            resp.setPendingPickups(pendingPickups);
            resp.setTodayDeliveries(todayDeliveries);
            resp.setPendingDeliveries(pendingDeliveries);
            resp.setLoyaltyPoints(loyaltyPoints);
            resp.setTotalSpent(totalSpent);
            resp.setRecentOrders(recentOrders);
            resp.setLowStockAlerts(lowStockAlerts);
            resp.setMaintenanceAlerts(maintenanceAlerts);
            resp.setOrderStatusDistribution(orderStatusDistribution);
            resp.setMonthlyOrders(monthlyOrders);
            resp.setMonthlyRevenue(monthlyRevenue);
            resp.setPaymentMethodBreakdown(paymentMethodBreakdown);
            resp.setMyRecentOrders(myRecentOrders);
            return resp;
        }
    }
}
