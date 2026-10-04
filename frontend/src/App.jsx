import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import BranchesPage from './pages/admin/BranchesPage';
import BranchManagersPage from './pages/admin/BranchManagersPage';
import UsersPage from './pages/admin/UsersPage';

// Branch Manager & Customer Dashboards
import ManagerDashboard from './pages/dashboard/ManagerDashboard';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';

// Operational Pages
import OrdersPage from './pages/orders/OrdersPage';
import PlaceOrderPage from './pages/orders/PlaceOrderPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import CustomersPage from './pages/customers/CustomersPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import ServicesPage from './pages/services/ServicesPage';
import EquipmentPage from './pages/equipment/EquipmentPage';
import InventoryPage from './pages/inventory/InventoryPage';
import StockTransactionsPage from './pages/inventory/StockTransactionsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import TasksPage from './pages/tasks/TasksPage';
import PickupsPage from './pages/pickups/PickupsPage';
import DeliveriesPage from './pages/deliveries/DeliveriesPage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import BreakdownsPage from './pages/equipment/BreakdownsPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role;
    // Normalize BRANCH_MANAGER to match BRANCH_MANAGER_ADMIN
    const normalizedUserRole = (userRole === 'BRANCH_MANAGER') ? 'BRANCH_MANAGER_ADMIN' : userRole;
    const normalizedAllowed = allowedRoles.map(r => r === 'BRANCH_MANAGER' ? 'BRANCH_MANAGER_ADMIN' : r);

    // ADMIN has universal access
    if (normalizedUserRole !== 'ADMIN' && !normalizedAllowed.includes(normalizedUserRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page on root URL */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Application Dashboard Routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            {/* 1. ADMIN EXCLUSIVE ROUTES */}
            <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/branches" element={<ProtectedRoute allowedRoles={['ADMIN']}><BranchesPage /></ProtectedRoute>} />
            <Route path="admin/branch-managers" element={<ProtectedRoute allowedRoles={['ADMIN']}><BranchManagersPage /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>} />

            {/* 2. BRANCH MANAGER ADMIN ROUTES */}
            <Route path="branch-manager/dashboard" element={<ProtectedRoute allowedRoles={['BRANCH_MANAGER_ADMIN']}><ManagerDashboard /></ProtectedRoute>} />
            <Route path="dashboard/manager" element={<Navigate to="/branch-manager/dashboard" replace />} />
            <Route path="manager/dashboard" element={<Navigate to="/branch-manager/dashboard" replace />} />

            {/* 3. CUSTOMER ROUTES */}
            <Route path="customer/dashboard" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="dashboard/customer" element={<Navigate to="/customer/dashboard" replace />} />

            {/* 4. OPERATIONAL & SHARED ROUTES */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/new" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><PlaceOrderPage /></ProtectedRoute>} />
            <Route path="orders/:id" element={<OrderDetailPage />} />

            <Route path="customers" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><CustomersPage /></ProtectedRoute>} />
            <Route path="employees" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><EmployeesPage /></ProtectedRoute>} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="equipment" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><EquipmentPage /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><InventoryPage /></ProtectedRoute>} />
            <Route path="stock-transactions" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><StockTransactionsPage /></ProtectedRoute>} />
            <Route path="suppliers" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><SuppliersPage /></ProtectedRoute>} />
            <Route path="maintenance" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><MaintenancePage /></ProtectedRoute>} />
            <Route path="breakdowns" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><BreakdownsPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><ReportsPage /></ProtectedRoute>} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="tasks" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER_ADMIN']}><TasksPage /></ProtectedRoute>} />
            <Route path="pickups" element={<PickupsPage />} />
            <Route path="deliveries" element={<DeliveriesPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="attendance" element={<Navigate to="/employees?tab=attendance" replace />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Legacy Manager Aliases */}
            <Route path="manager/orders" element={<Navigate to="/orders" replace />} />
            <Route path="manager/customers" element={<Navigate to="/customers" replace />} />
            <Route path="manager/employees" element={<Navigate to="/employees" replace />} />
            <Route path="manager/pickups" element={<Navigate to="/pickups" replace />} />
            <Route path="manager/deliveries" element={<Navigate to="/deliveries" replace />} />
            <Route path="customer/deliveries" element={<Navigate to="/deliveries" replace />} />
            <Route path="manager/tasks" element={<Navigate to="/tasks" replace />} />
            <Route path="manager/services" element={<Navigate to="/services" replace />} />
            <Route path="manager/inventory" element={<Navigate to="/inventory" replace />} />
            <Route path="manager/stock-transactions" element={<Navigate to="/stock-transactions" replace />} />
            <Route path="manager/suppliers" element={<Navigate to="/suppliers" replace />} />
            <Route path="manager/equipment" element={<Navigate to="/equipment" replace />} />
            <Route path="manager/maintenance" element={<Navigate to="/maintenance" replace />} />
            <Route path="manager/breakdowns" element={<Navigate to="/breakdowns" replace />} />
            <Route path="manager/payments" element={<Navigate to="/payments" replace />} />
            <Route path="manager/reports" element={<Navigate to="/reports" replace />} />
            <Route path="manager/feedback" element={<Navigate to="/feedback" replace />} />
            <Route path="customer/feedback" element={<Navigate to="/feedback" replace />} />
            <Route path="manager/complaints" element={<Navigate to="/complaints" replace />} />
            <Route path="customer/complaints" element={<Navigate to="/complaints" replace />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
