import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { 
  FiHome, FiPieChart, FiShoppingBag, FiUsers, FiUserCheck, 
  FiTruck, FiCheckSquare, FiGrid, FiPackage, FiTruck as FiSupplier, 
  FiCpu, FiTool, FiDollarSign, FiFileText, FiMessageSquare, 
  FiAlertCircle, FiSettings, FiLogOut, FiSliders, FiAlertTriangle 
} from 'react-icons/fi';

const Sidebar = () => {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const managerSections = [
    {
      title: 'MAIN',
      links: [
        { path: '/manager/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/manager/reports', label: 'Analytics', icon: <FiPieChart /> },
      ]
    },
    {
      title: 'OPERATIONS',
      links: [
        { path: '/manager/orders', label: 'Orders', icon: <FiShoppingBag /> },
        { path: '/manager/customers', label: 'Customers', icon: <FiUsers /> },
        { path: '/manager/employees', label: 'Employees', icon: <FiUserCheck /> },
        { path: '/manager/pickups', label: 'Pickups', icon: <FiTruck /> },
        { path: '/manager/deliveries', label: 'Deliveries', icon: <FiPackage /> },
        { path: '/manager/tasks', label: 'Tasks', icon: <FiCheckSquare /> },
        { path: '/manager/services', label: 'Services', icon: <FiGrid /> },
      ]
    },
    {
      title: 'INVENTORY & ASSETS',
      links: [
        { path: '/manager/inventory', label: 'Inventory', icon: <FiPackage /> },
        { path: '/manager/stock-transactions', label: 'Stock Movements', icon: <FiSliders /> },
        { path: '/manager/suppliers', label: 'Suppliers', icon: <FiSupplier /> },
        { path: '/manager/equipment', label: 'Equipment', icon: <FiCpu /> },
        { path: '/manager/maintenance', label: 'Maintenance', icon: <FiTool /> },
        { path: '/manager/breakdowns', label: 'Breakdowns', icon: <FiAlertTriangle /> },
      ]
    },
    {
      title: 'FINANCE',
      links: [
        { path: '/manager/payments', label: 'Payments', icon: <FiDollarSign /> },
        { path: '/manager/reports', label: 'Reports', icon: <FiFileText /> },
      ]
    },
    {
      title: 'CUSTOMER FEEDBACK',
      links: [
        { path: '/manager/feedback', label: 'Feedback', icon: <FiMessageSquare /> },
        { path: '/manager/complaints', label: 'Complaints', icon: <FiAlertCircle /> },
      ]
    }
  ];

  const customerSections = [
    {
      title: 'MAIN',
      links: [
        { path: '/customer/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/customer/orders/new', label: 'Place Order', icon: <FiShoppingBag /> },
        { path: '/customer/orders', label: 'My Orders', icon: <FiFileText /> },
        { path: '/customer/pickups', label: 'Pickups', icon: <FiTruck /> },
        { path: '/customer/deliveries', label: 'Deliveries', icon: <FiPackage /> },
        { path: '/customer/payments', label: 'Payments', icon: <FiDollarSign /> },
        { path: '/customer/feedback', label: 'Feedback', icon: <FiMessageSquare /> },
        { path: '/customer/complaints', label: 'Complaints', icon: <FiAlertCircle /> },
      ]
    }
  ];

  const defaultSections = [
    {
      title: 'MAIN',
      links: [
        { path: role === 'LAUNDRY_STAFF' ? '/staff/dashboard' : role === 'DELIVERY_DRIVER' ? '/driver/dashboard' : '/reception/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/orders', label: 'Orders', icon: <FiShoppingBag /> }
      ]
    }
  ];

  const currentRole = user?.role || role;
  const isBM = currentRole === 'BRANCH_MANAGER' || currentRole === 'BRANCH_MANAGER_ADMIN' || currentRole === 'ADMIN';
  const sections = isBM ? managerSections : currentRole === 'CUSTOMER' ? customerSections : defaultSections;

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflowY: 'auto'
    }}>
      {/* Sidebar Header Logo */}
      <div style={{ padding: '1.5rem 1.25rem 1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <Logo size="medium" />
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {sections.map((section, idx) => (
          <div key={idx}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.8px',
              padding: '0 0.75rem 0.5rem 0.75rem'
            }}>
              {section.title}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {section.links.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                    transition: 'all 0.15s ease-in-out',
                    textDecoration: 'none'
                  })}
                >
                  <span style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* User Footer Profile Card */}
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
            {user?.fullName ? user.fullName.charAt(0) : 'U'}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'white', margin: 0, fontSize: '0.85rem' }}>{user?.fullName || 'Kamal Silva'}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>{role?.replace('_', ' ')}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          title="Logout"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
