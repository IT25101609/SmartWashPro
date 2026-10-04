import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ role }) => {
  const { isAuthenticated, role: userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    // Redirect based on role if unauthorized
    if (userRole === 'BRANCH_MANAGER') return <Navigate to="/manager/dashboard" replace />;
    if (userRole === 'CUSTOMER') return <Navigate to="/customer/dashboard" replace />;
    if (userRole === 'LAUNDRY_STAFF') return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
