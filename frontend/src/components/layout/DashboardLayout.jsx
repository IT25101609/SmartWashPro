import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import api from '../../api/axios';
import { 
  FiGrid, FiBarChart2, FiShoppingBag, FiUsers, FiUser, 
  FiTruck, FiCheckSquare, FiPackage, FiSettings, 
  FiTool, FiCreditCard, FiDollarSign, FiBarChart, FiStar, 
  FiAlertTriangle, FiShield, FiChevronRight, FiMoreVertical, 
  FiBell, FiPlus, FiFileText, FiCalendar, FiFilter,
  FiLock, FiLogOut, FiInfo
} from 'react-icons/fi';

// Custom Shirt icon SVG for Services
const ShirtIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a2 2 0 0 0 1.98 1.67H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10.83h1.16a2 2 0 0 0 1.98-1.67l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

// Custom Dashboard Circle Icon (Matches Screenshot)
const DashboardCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 12L16 10" />
    <path d="M12 7v5" />
  </svg>
);

const navConfig = {
  ADMIN: [
    {
      section: 'SYSTEM ADMINISTRATION',
      items: [
        { path: '/admin/dashboard', icon: <DashboardCircleIcon />, label: 'Admin Dashboard' },
        { path: '/reports', icon: <FiBarChart2 />, label: 'Islandwide Analytics' },
        { path: '/admin/branches', icon: <FiShield />, label: 'Manage Branches' },
        { path: '/admin/branch-managers', icon: <FiUsers />, label: 'Branch Managers' },
        { path: '/admin/users', icon: <FiUser />, label: 'All Users' },
      ]
    },
    {
      section: 'OPERATIONS',
      items: [
        { path: '/orders', icon: <FiShoppingBag />, label: 'All Orders', hasChevron: true },
        { path: '/customers', icon: <FiUsers />, label: 'Customers' },
        { path: '/employees', icon: <FiUser />, label: 'Staff Management' },
        { path: '/services', icon: <ShirtIcon />, label: 'Services Catalog' },
      ]
    },
    {
      section: 'INVENTORY & ASSETS',
      items: [
        { path: '/inventory', icon: <FiPackage />, label: 'Inventory', hasChevron: true },
        { path: '/suppliers', icon: <FiTruck />, label: 'Suppliers' },
        { path: '/equipment', icon: <FiSettings />, label: 'Equipment' },
        { path: '/maintenance', icon: <FiTool />, label: 'Maintenance' },
      ]
    },
    {
      section: 'FINANCE & FEEDBACK',
      items: [
        { path: '/payments', icon: <FiCreditCard />, label: 'Payments', hasChevron: true },
        { path: '/feedback', icon: <FiStar />, label: 'Feedback' },
        { path: '/complaints', icon: <FiAlertTriangle />, label: 'Complaints' },
      ]
    }
  ],
  BRANCH_MANAGER_ADMIN: [
    { 
      section: 'MAIN', 
      items: [
        { path: '/branch-manager/dashboard', icon: <DashboardCircleIcon />, label: 'Branch Dashboard' },
        { path: '/reports', icon: <FiBarChart2 />, label: 'Analytics' },
      ]
    },
    { 
      section: 'BRANCH OPERATIONS', 
      items: [
        { path: '/orders', icon: <FiShoppingBag />, label: 'Branch Orders', hasChevron: true },
        { path: '/employees', icon: <FiUser />, label: 'Staff Management' },
        { path: '/customers', icon: <FiUsers />, label: 'Customers' },
        { path: '/pickups', icon: <FiTruck />, label: 'Pickups & Deliveries' },
        { path: '/tasks', icon: <FiCheckSquare />, label: 'Tasks' },
        { path: '/services', icon: <ShirtIcon />, label: 'Services' },
      ]
    },
    { 
      section: 'INVENTORY & ASSETS', 
      items: [
        { path: '/inventory', icon: <FiPackage />, label: 'Inventory Stock', hasChevron: true },
        { path: '/suppliers', icon: <FiTruck />, label: 'Suppliers' },
        { path: '/equipment', icon: <FiSettings />, label: 'Equipment' },
        { path: '/maintenance', icon: <FiTool />, label: 'Maintenance' },
      ]
    },
    { 
      section: 'FINANCE & FEEDBACK', 
      items: [
        { path: '/payments', icon: <FiCreditCard />, label: 'Payments', hasChevron: true },
        { path: '/feedback', icon: <FiStar />, label: 'Feedback' },
        { path: '/complaints', icon: <FiAlertTriangle />, label: 'Complaints' },
      ]
    }
  ],
  CUSTOMER: [
    { 
      section: 'MAIN', 
      items: [
        { path: '/customer/dashboard', icon: <DashboardCircleIcon />, label: 'Dashboard' },
        { path: '/orders/new', icon: <FiPlus />, label: 'Place Order' },
        { path: '/orders', icon: <FiShoppingBag />, label: 'My Orders', hasChevron: true },
        { path: '/pickups', icon: <FiTruck />, label: 'Pickups' },
        { path: '/payments', icon: <FiCreditCard />, label: 'Payments' },
      ]
    },
    { 
      section: 'SUPPORT', 
      items: [
        { path: '/feedback', icon: <FiStar />, label: 'Feedback' },
        { path: '/complaints', icon: <FiAlertTriangle />, label: 'Complaints' },
        { path: '/notifications', icon: <FiBell />, label: 'Notifications' },
      ]
    }
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // null | 'profile' | 'password' | 'about'
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const nav = navConfig[user?.role] || navConfig.BRANCH_MANAGER_ADMIN || navConfig.ADMIN || [];

  useEffect(() => {
    const handleClose = () => setMenuOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openProfile = async () => {
    setModal('profile');
    setProfileLoading(true);
    try {
      const res = await api.get('/auth/me');
      setProfileData(res.data);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordMsg({ type: '', text: '' });
    setModal('password');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => {
        setModal(null);
      }, 1500);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password. Please check your current password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SW';
  const getPageTitle = () => {
    const allItems = (nav || []).flatMap(s => s.items);
    const current = allItems.find(item => location.pathname === item.path);
    return current?.label || 'Dashboard';
  };
  const formatRole = (role) => {
    if (role === 'ADMIN') return '👑 System Admin';
    if (role === 'BRANCH_MANAGER_ADMIN' || role === 'BRANCH_MANAGER') {
      return user?.branchId ? `🏢 Branch Manager (#${user.branchId})` : '🏢 Branch Manager';
    }
    if (role === 'CUSTOMER') return '🛒 Customer';
    return role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'User';
  };

  const popupItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#D0D0E0',
    fontSize: '0.85rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-root)' }}>
      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 'var(--sidebar-w)',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          overflowY: 'auto'
        }}
      >
        {/* Logo Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem 1.25rem' }}>
          <Link 
            to={user?.role === 'ADMIN' ? '/admin/dashboard' : (user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER') ? '/branch-manager/dashboard' : '/customer/dashboard'} 
            style={{ textDecoration: 'none' }}
          >
            <Logo size="medium" />
          </Link>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.75rem 1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {nav.map((section, idx) => (
            <div key={idx}>
              <div className="sidebar-section-label">
                {section.section}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path.endsWith('/dashboard/manager') || item.path.endsWith('/dashboard/customer') || item.path.endsWith('staff') || item.path.endsWith('driver') || item.path.endsWith('finance') || item.path.endsWith('receptionist')}
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span className="sidebar-item-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.hasChevron && (
                      <FiChevronRight style={{ marginLeft: 'auto', fontSize: '0.85rem', opacity: 0.5 }} />
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ 
          position: 'relative',
          padding: '0.85rem 1rem', 
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Profile Menu Popup above the profile footer */}
          {menuOpen && (
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: '72px',
                left: '10px',
                right: '10px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 250,
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              {/* Header Info */}
              <div style={{ 
                padding: '0.5rem 0.7rem 0.6rem 0.7rem', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                marginBottom: '4px' 
              }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#FFFFFF', fontSize: '0.88rem' }}>
                  {user?.fullName || 'User'}
                </p>
                <p style={{ margin: '2px 0 6px 0', color: '#888899', fontSize: '0.74rem' }}>
                  {user?.email || ''}
                </p>
                <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  ● {formatRole(user?.role)}
                </span>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => { setMenuOpen(false); openProfile(); }}
                style={popupItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <FiUser size={16} style={{ color: '#FF6B00' }} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => { setMenuOpen(false); openPasswordModal(); }}
                style={popupItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <FiLock size={16} style={{ color: '#FF6B00' }} />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => { setMenuOpen(false); navigate('/notifications'); }}
                style={popupItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <FiBell size={16} style={{ color: '#FF6B00' }} />
                <span>Notifications</span>
              </button>

              <button
                onClick={() => { setMenuOpen(false); setModal('about'); }}
                style={popupItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <FiInfo size={16} style={{ color: '#FF6B00' }} />
                <span>System Info</span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

              {/* Log Out Option */}
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                style={{
                  ...popupItemStyle,
                  color: '#EF4444',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <FiLogOut size={16} style={{ color: '#EF4444' }} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B00 0%, #E55B00 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 2px 8px rgba(255,107,0,0.3)'
            }}>
              {getInitials(user?.fullName || 'User')}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '0.85rem' }}>{user?.fullName || 'User'}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{formatRole(user?.role)}</p>
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }} 
            title="Account Options"
            style={{ 
              background: menuOpen ? 'rgba(255, 107, 0, 0.2)' : 'none', 
              border: 'none', 
              color: menuOpen ? '#FF6B00' : '#808090', 
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <FiMoreVertical size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'var(--bg-root)' }}>
        {/* Top Navigation Bar */}
        <header style={{ 
          height: 'var(--topbar-h)', 
          backgroundColor: 'var(--bg-sidebar)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: window.innerWidth <= 768 ? 'block' : 'none', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}
            >☰</button>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{getPageTitle()}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user?.role === 'ADMIN' && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255, 107, 0, 0.15)', color: '#FF6B00', border: '1px solid rgba(255, 107, 0, 0.3)', padding: '4px 12px', borderRadius: '20px' }}>
                👑 Admin Panel
              </span>
            )}
            {(user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER') && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255, 107, 0, 0.15)', color: '#FF6B00', border: '1px solid rgba(255, 107, 0, 0.3)', padding: '4px 12px', borderRadius: '20px' }}>
                🏢 Branch Manager Panel
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main style={{ flex: 1, padding: 'var(--sp-6)', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* PROFILE DETAILS MODAL */}
      {modal === 'profile' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">👤 My Account Profile</h3>
              <button className="btn btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            {profileLoading ? (
              <div className="loading" style={{ padding: '2rem' }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 4px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px', background: 'rgba(255, 107, 0, 0.08)', borderRadius: 10 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B00 0%, #E55B00 100%)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700
                  }}>
                    {getInitials(profileData?.fullName || user?.fullName)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.05rem' }}>{profileData?.fullName || user?.fullName}</h3>
                    <p style={{ margin: '2px 0 0 0', color: '#A0A0B0', fontSize: '0.8rem' }}>{profileData?.email || user?.email}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 2px 0' }}>Role</p>
                    <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, margin: 0 }}>{formatRole(profileData?.role || user?.role)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 2px 0' }}>Status</p>
                    <span className="badge badge-success">● {profileData?.status || 'ACTIVE'}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 2px 0' }}>Phone Number</p>
                    <p style={{ color: 'var(--color-text-primary)', margin: 0 }}>{profileData?.phoneNumber || '0712345678'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 2px 0' }}>Branch</p>
                    <p style={{ color: 'var(--color-text-primary)', margin: 0 }}>Crystal Clean Laundry</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 2px 0' }}>Address</p>
                    <p style={{ color: 'var(--color-text-primary)', margin: 0 }}>{profileData?.address || '12 Main Street, Colombo 03'}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {modal === 'password' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔑 Change Password</h3>
              <button className="btn btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            {passwordMsg.text && (
              <div className={`alert ${passwordMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {passwordMsg.text}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="At least 6 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                  {passwordSaving ? '⏳ Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM INFO MODAL */}
      {modal === 'about' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⚙️ SmartWash Pro System Info</h3>
              <button className="btn btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px 16px' }}>
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 8 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#FFFFFF' }}>SmartWash Pro Enterprise</p>
                <p style={{ margin: '3px 0 0 0', color: '#888899', fontSize: '0.8rem' }}>Crystal Clean Laundry (Pvt) Ltd</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                <div><span style={{ color: '#888899' }}>Platform Version:</span> <strong style={{ color: 'white' }}>v1.0.0</strong></div>
                <div><span style={{ color: '#888899' }}>API Status:</span> <span className="badge badge-success">● Connected</span></div>
                <div><span style={{ color: '#888899' }}>Database:</span> <strong style={{ color: 'white' }}>MySQL 8.0 (HikariCP)</strong></div>
                <div><span style={{ color: '#888899' }}>Auth Protocol:</span> <strong style={{ color: 'white' }}>JWT (HMAC-SHA256)</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
