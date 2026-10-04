import React, { useEffect, useState, useMemo, useCallback } from 'react';
import complaintService from '../../services/complaintService';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FiAlertCircle, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSearch, 
  FiCheckCircle, FiClock, FiX, FiFilter, FiUserCheck, FiShoppingBag, 
  FiUser, FiFileText, FiCheckSquare, FiAlertTriangle, FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'DAMAGED_ITEMS', label: 'Damaged / Torn Items' },
  { value: 'MISSING_ITEMS', label: 'Missing / Lost Clothes' },
  { value: 'POOR_CLEANING', label: 'Poor Cleaning / Stains' },
  { value: 'LATE_DELIVERY', label: 'Late Pickup or Delivery' },
  { value: 'STAFF_BEHAVIOR', label: 'Staff Behavior / Customer Service' },
  { value: 'BILLING_ISSUE', label: 'Pricing / Billing Discrepancy' },
  { value: 'PACKAGING', label: 'Damaged Packaging / Folding' },
  { value: 'OTHER', label: 'Other Inquiries / Issues' }
];

const STATUS_CONFIG = {
  OPEN: { label: 'Open', badge: 'badge-warning', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  IN_PROGRESS: { label: 'Under Investigation', badge: 'badge-info', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' },
  RESOLVED: { label: 'Resolved', badge: 'badge-success', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' },
  CLOSED: { label: 'Closed', badge: 'badge-neutral', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)' }
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: '#38BDF8', badge: 'badge-info' },
  MEDIUM: { label: 'Medium', color: '#F59E0B', badge: 'badge-warning' },
  HIGH: { label: 'High', color: '#EF4444', badge: 'badge-error' }
};

const F = ({ label, required, children }) => (
  <div className="form-group" style={{ marginBottom: '1.1rem' }}>
    <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    {children}
  </div>
);

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER';
  const isCustomer = user?.role === 'CUSTOMER';
  const canManageAll = isAdmin || isManager;

  // Complaints Data & Stats
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState(isCustomer ? 'my' : 'all'); // 'all' | 'my'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals: 'create' | 'edit' | 'assign' | 'resolve' | 'close' | 'view' | 'delete'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State for Create / Edit
  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    category: 'DAMAGED_ITEMS',
    priority: 'MEDIUM',
    subject: '',
    description: '',
    assignedEmployeeId: ''
  });

  // Action Form States
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [closeRemarks, setCloseRemarks] = useState('');

  // Dropdown Data
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load Complaints List
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { size: 100 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (dateFilter) params.date = dateFilter;
      if (activeTab === 'my' && isCustomer) params.myOnly = true;

      const res = (activeTab === 'my' && isCustomer)
        ? await complaintService.getMyComplaints(params)
        : await complaintService.getComplaints(params);

      setComplaints(res.content || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      toast.error('Failed to fetch complaints.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, categoryFilter, dateFilter, activeTab, isCustomer]);

  // Load Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await complaintService.getComplaintStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load complaint stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch Aux Data for Modals
  const loadCustomers = async () => {
    if (!canManageAll) return;
    try {
      const res = await api.get('/customers', { params: { size: 100 } });
      setCustomers(res.data?.content || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadEmployees = async () => {
    if (!canManageAll) return;
    try {
      const res = await api.get('/employees', { params: { size: 100 } });
      const activeStaff = (res.data?.content || []).filter(e => e.employmentStatus === 'ACTIVE');
      setEmployees(activeStaff);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadOrdersForCustomer = async (targetCustomerId = null) => {
    setLoadingOrders(true);
    try {
      let endpoint = '/orders';
      const params = { size: 50 };
      if (isCustomer) {
        endpoint = '/orders/my';
      } else if (targetCustomerId) {
        endpoint = `/orders/customer/${targetCustomerId}`;
      }
      const res = await api.get(endpoint, { params });
      setOrders(res.data?.content || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setForm({
      customerId: '',
      orderId: '',
      category: 'DAMAGED_ITEMS',
      priority: 'MEDIUM',
      subject: '',
      description: '',
      assignedEmployeeId: ''
    });
    setError('');
    setModal('create');

    if (canManageAll) {
      loadCustomers();
      loadEmployees();
    }
    loadOrdersForCustomer();
  };

  const handleCustomerSelect = (customerId) => {
    setForm(prev => ({ ...prev, customerId, orderId: '' }));
    loadOrdersForCustomer(customerId || null);
  };

  const handleOrderSelect = (orderId) => {
    if (!orderId) {
      setForm(prev => ({ ...prev, orderId: '' }));
      return;
    }
    const selectedOrder = orders.find(o => String(o.id) === String(orderId));
    setForm(prev => ({
      ...prev,
      orderId,
      customerId: (selectedOrder?.customerId) ? String(selectedOrder.customerId) : prev.customerId
    }));
  };

  // Open View Modal
  const openViewModal = (item) => {
    setSelected(item);
    setModal('view');
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setSelected(item);
    setForm({
      customerId: item.customerId || '',
      orderId: item.orderId || '',
      category: item.category || 'OTHER',
      priority: item.priority || 'MEDIUM',
      subject: item.subject || '',
      description: item.description || '',
      assignedEmployeeId: item.assignedEmployeeId || '',
      status: item.status || 'OPEN',
      resolution: item.resolution || ''
    });
    setError('');
    setModal('edit');
    if (canManageAll) {
      loadCustomers();
      loadEmployees();
    }
    loadOrdersForCustomer(item.customerId || null);
  };

  // Open Assign Modal
  const openAssignModal = (item) => {
    setSelected(item);
    setAssignEmployeeId(item.assignedEmployeeId || '');
    setError('');
    setModal('assign');
    loadEmployees();
  };

  // Open Resolve Modal
  const openResolveModal = (item) => {
    setSelected(item);
    setResolutionText(item.resolution || '');
    setError('');
    setModal('resolve');
  };

  // Open Close Modal
  const openCloseModal = (item) => {
    setSelected(item);
    setCloseRemarks('');
    setError('');
    setModal('close');
  };

  // Open Delete Modal
  const openDeleteModal = (item) => {
    setSelected(item);
    setError('');
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
  };

  // Create Complaint Submission
  const handleCreate = async (e) => {
    e.preventDefault();
    if (canManageAll && !form.customerId && !form.orderId) {
      setError('Please select a customer or link an order for this complaint.');
      return;
    }
    if (!form.subject.trim()) {
      setError('Please provide a complaint subject.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please provide detailed description of the complaint.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        orderId: form.orderId ? Number(form.orderId) : null
      };

      if (canManageAll && form.customerId) {
        payload.customerId = Number(form.customerId);
      }
      if (canManageAll && form.assignedEmployeeId) {
        payload.assignedEmployeeId = Number(form.assignedEmployeeId);
      }

      await complaintService.createComplaint(payload);
      toast.success('Complaint logged successfully.');
      closeModal();
      fetchComplaints();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit complaint';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Edit Complaint Submission
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setError('Please provide a complaint subject.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please provide detailed description of the complaint.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        orderId: form.orderId ? Number(form.orderId) : null,
        assignedEmployeeId: form.assignedEmployeeId ? Number(form.assignedEmployeeId) : null,
        status: form.status,
        resolution: form.resolution?.trim() || null
      };
      if (canManageAll && form.customerId) {
        payload.customerId = Number(form.customerId);
      }

      await complaintService.updateComplaint(selected.id, payload);
      toast.success('Complaint updated successfully.');
      closeModal();
      fetchComplaints();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update complaint';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Assign Employee Handler
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignEmployeeId) {
      setError('Please select an employee to assign.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await complaintService.assignEmployee(selected.id, Number(assignEmployeeId));
      toast.success('Employee assigned. Status set to Under Investigation (IN_PROGRESS).');
      closeModal();
      fetchComplaints();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign employee';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Resolve Complaint Handler
  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionText.trim()) {
      setError('Please document investigation findings and resolution steps.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await complaintService.resolveComplaint(selected.id, resolutionText.trim());
      toast.success('Complaint marked as RESOLVED.');
      closeModal();
      fetchComplaints();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resolve complaint';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Close Complaint Handler
  const handleClose = async () => {
    setSaving(true);
    setError('');
    try {
      await complaintService.closeComplaint(selected.id, closeRemarks.trim());
      toast.success('Complaint ticket formally CLOSED.');
      closeModal();
      fetchComplaints();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to close complaint';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete Complaint Handler
  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await complaintService.deleteComplaint(selected.id);
      toast.success('Complaint deleted.');
      closeModal();
      fetchComplaints();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete complaint';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '0 0.5rem 3rem 0.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            margin: 0,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <FiAlertCircle style={{ color: '#EF4444' }} />
            {isCustomer ? 'My Support Complaints' : 'Customer Complaint Management'}
          </h1>
          <p style={{ color: '#94A3B8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {isCustomer
              ? 'Report and track resolutions for fabric, stain, laundry quality, and delivery issues.'
              : 'Investigate customer disputes, assign staff, document resolutions, and manage ticket lifecycles.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => { fetchComplaints(); fetchStats(); }} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiRefreshCw /> Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={openCreateModal} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <FiPlus /> File Complaint
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Complaints */}
        <div className="card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 107, 0, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            <FiFileText />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
              {stats?.total ?? complaints.length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>Total Complaints</div>
          </div>
        </div>

        {/* Open Complaints */}
        <div 
          className="card-glass" 
          onClick={() => setStatusFilter(statusFilter === 'OPEN' ? 'ALL' : 'OPEN')}
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            cursor: 'pointer',
            border: statusFilter === 'OPEN' ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            <FiClock />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>
              {stats?.open ?? complaints.filter(c => c.status === 'OPEN').length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>Open Tickets</div>
          </div>
        </div>

        {/* In Progress */}
        <div 
          className="card-glass" 
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            cursor: 'pointer',
            border: statusFilter === 'IN_PROGRESS' ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            <FiUserCheck />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>
              {stats?.inProgress ?? complaints.filter(c => c.status === 'IN_PROGRESS').length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>Under Investigation</div>
          </div>
        </div>

        {/* Resolved */}
        <div 
          className="card-glass" 
          onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            cursor: 'pointer',
            border: statusFilter === 'RESOLVED' ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            color: '#22C55E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            <FiCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22C55E', lineHeight: 1 }}>
              {stats?.resolved ?? complaints.filter(c => c.status === 'RESOLVED').length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>Resolved</div>
          </div>
        </div>

        {/* Closed */}
        <div 
          className="card-glass" 
          onClick={() => setStatusFilter(statusFilter === 'CLOSED' ? 'ALL' : 'CLOSED')}
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            cursor: 'pointer',
            border: statusFilter === 'CLOSED' ? '1px solid #94A3B8' : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(148, 163, 184, 0.15)',
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            <FiCheckSquare />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#94A3B8', lineHeight: 1 }}>
              {stats?.closed ?? complaints.filter(c => c.status === 'CLOSED').length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>Closed</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search & Filter Bar */}
      <div className="card-glass" style={{
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Left: View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'all' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'all' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiFileText size={15} /> All Complaints
          </button>
          {isCustomer && (
            <button
              onClick={() => setActiveTab('my')}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'my' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'my' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiUser size={15} /> My Complaints
            </button>
          )}
        </div>

        {/* Right: Search & Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search subject, order #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.85rem', height: '38px', backgroundColor: '#0F172A' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.85rem', height: '38px', backgroundColor: '#0F172A', minWidth: '135px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            className="form-input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ fontSize: '0.85rem', height: '38px', backgroundColor: '#0F172A', minWidth: '130px' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Category Filter */}
          <select
            className="form-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ fontSize: '0.85rem', height: '38px', backgroundColor: '#0F172A', minWidth: '150px' }}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#A0A0B0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 1.5rem', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
            No Complaints Found
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#94A3B8', fontSize: '0.9rem', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No tickets match your filter criteria. Try adjusting or clearing filters.'
              : 'No complaints logged. All customer orders are operating smoothly!'}
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ fontWeight: 600 }}>
            File a Complaint
          </button>
        </div>
      ) : (
        <div className="card-glass" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '1rem' }}>Ticket</th>
                <th style={{ padding: '1rem' }}>Customer</th>
                <th style={{ padding: '1rem' }}>Linked Order</th>
                <th style={{ padding: '1rem' }}>Subject & Issue</th>
                <th style={{ padding: '1rem' }}>Priority</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Assigned Staff</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const statusConf = STATUS_CONFIG[c.status] || STATUS_CONFIG.OPEN;
                const priorityConf = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.MEDIUM;
                const isOwner = isCustomer && user?.fullName === c.customerName;
                const canEdit = isOwner || canManageAll;
                const canDelete = isOwner || canManageAll;

                return (
                  <tr 
                    key={c.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Ticket ID & Category */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.92rem' }}>
                        #{c.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                        {c.category?.replace(/_/g, ' ') || 'OTHER'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.9rem' }}>
                        {c.customerName || 'Customer'}
                      </div>
                      {c.customerPhone && (
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{c.customerPhone}</div>
                      )}
                    </td>

                    {/* Linked Order */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      {c.orderId ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          color: '#38BDF8',
                          fontWeight: 600
                        }}>
                          <FiShoppingBag size={12} />
                          <span>Order #{c.orderId}</span>
                          {c.orderStatus && (
                            <span style={{ color: '#22C55E', fontSize: '0.7rem' }}>({c.orderStatus})</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#64748B', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>

                    {/* Subject & Description */}
                    <td style={{ padding: '1rem', maxWidth: '320px' }}>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.92rem', marginBottom: '3px' }}>
                        {c.subject}
                      </div>
                      <div style={{
                        color: '#94A3B8',
                        fontSize: '0.82rem',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {c.description}
                      </div>
                      {c.resolution && (
                        <div style={{
                          marginTop: '6px',
                          fontSize: '0.75rem',
                          color: '#22C55E',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          borderLeft: '2px solid #22C55E'
                        }}>
                          <strong>Resolution:</strong> {c.resolution}
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${priorityConf.badge}`} style={{ fontSize: '0.75rem' }}>
                        {priorityConf.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <span 
                        style={{
                          backgroundColor: statusConf.bg,
                          color: statusConf.color,
                          border: `1px solid ${statusConf.border}`,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusConf.color }} />
                        {statusConf.label}
                      </span>
                    </td>

                    {/* Assigned Employee */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      {c.assignedEmployeeName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 107, 0, 0.2)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {c.assignedEmployeeName.charAt(0)}
                          </div>
                          <span style={{ color: '#E2E8F0', fontSize: '0.85rem' }}>{c.assignedEmployeeName}</span>
                        </div>
                      ) : canManageAll ? (
                        <button
                          onClick={() => openAssignModal(c)}
                          className="btn btn-outline"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: 'rgba(255, 107, 0, 0.4)', color: 'var(--primary)' }}
                        >
                          + Assign Staff
                        </button>
                      ) : (
                        <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* View Button */}
                        <button
                          className="btn btn-outline"
                          onClick={() => openViewModal(c)}
                          style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                          title="View Details"
                        >
                          <FiEye size={13} />
                        </button>

                        {/* Manager Workflow Actions */}
                        {canManageAll && c.status !== 'CLOSED' && (
                          <>
                            {c.status === 'OPEN' && (
                              <button
                                className="btn btn-outline"
                                onClick={() => openAssignModal(c)}
                                style={{ padding: '5px 9px', fontSize: '0.75rem', color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                                title="Assign Employee to Investigate"
                              >
                                <FiUserCheck size={13} /> Assign
                              </button>
                            )}

                            {(c.status === 'OPEN' || c.status === 'IN_PROGRESS') && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => openResolveModal(c)}
                                style={{ padding: '5px 9px', fontSize: '0.75rem', color: '#22C55E', borderColor: 'rgba(34, 197, 94, 0.3)' }}
                                title="Add Resolution"
                              >
                                <FiCheckCircle size={13} /> Resolve
                              </button>
                            )}

                            {c.status === 'RESOLVED' && (
                              <button
                                className="btn btn-primary"
                                onClick={() => openCloseModal(c)}
                                style={{ padding: '5px 9px', fontSize: '0.75rem' }}
                                title="Close Ticket"
                              >
                                <FiCheckSquare size={13} /> Close
                              </button>
                            )}
                          </>
                        )}

                        {/* Edit Button */}
                        {canEdit && c.status !== 'CLOSED' && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEditModal(c)}
                            style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                            title="Edit Complaint"
                          >
                            <FiEdit2 size={13} />
                          </button>
                        )}

                        {/* Delete Button */}
                        {canDelete && (
                          <button
                            className="btn btn-outline"
                            onClick={() => openDeleteModal(c)}
                            style={{ padding: '5px 8px', fontSize: '0.75rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Delete Complaint"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE COMPLAINT MODAL */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 620, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(255, 107, 0, 0.3)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAlertCircle /> File Customer Complaint
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: '1rem 0 0 0' }}>{error}</div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', padding: '1.25rem 0' }}>
                {/* Manager / Admin Customer Selector */}
                {canManageAll && (
                  <F label="Select Customer" required>
                    <select
                      className="form-input"
                      value={form.customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                      required
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.email || c.phoneNumber})
                        </option>
                      ))}
                    </select>
                  </F>
                )}

                {/* Link to Order (Optional or Selectable) */}
                <F label="Link Order (Optional)">
                  {loadingOrders ? (
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Loading customer orders...</div>
                  ) : (
                    <select
                      className="form-input"
                      value={form.orderId}
                      onChange={(e) => handleOrderSelect(e.target.value)}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    >
                      <option value="">-- No Specific Order / General Issue --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Order #{o.id} ({o.orderStatus}) — Rs. {Number(o.totalPrice || 0).toFixed(2)}
                          {o.createdAt ? ` • ${new Date(o.createdAt).toLocaleDateString()}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </F>

                {/* Category & Priority Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <F label="Complaint Category" required>
                    <select
                      className="form-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                      required
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </F>

                  <F label="Priority Level" required>
                    <select
                      className="form-input"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                      required
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High / Urgent</option>
                    </select>
                  </F>
                </div>

                {/* Subject */}
                <F label="Subject" required>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Stained linen shirt after dry cleaning"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    required
                  />
                </F>

                {/* Description */}
                <F label="Detailed Description of the Issue" required>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Provide full context, affected clothing items, damage description, or delivery details..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    required
                  />
                </F>

                {/* Manager Assign Employee upon creation */}
                {canManageAll && (
                  <F label="Assign Staff Member (Optional)">
                    <select
                      className="form-input"
                      value={form.assignedEmployeeId}
                      onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value })}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    >
                      <option value="">-- Leave Unassigned (OPEN) --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.role?.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      Assigning an employee will automatically set the complaint status to Under Investigation (IN_PROGRESS).
                    </small>
                  </F>
                )}
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontWeight: 600 }}>
                  {saving ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMPLAINT MODAL */}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(255, 107, 0, 0.3)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#FF6B00' }}>✏️ Edit Complaint #{selected?.id}</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: '1rem 0 0 0' }}>{error}</div>
            )}

            <form onSubmit={handleEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', padding: '1.25rem 0' }}>
                {/* Manager / Admin Customer Selector */}
                {canManageAll ? (
                  <F label="Customer" required>
                    <select
                      className="form-input"
                      value={form.customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                      required
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.email || c.phoneNumber})
                        </option>
                      ))}
                    </select>
                  </F>
                ) : (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    color: '#94A3B8',
                    fontSize: '0.85rem'
                  }}>
                    Customer: <strong style={{ color: '#FFFFFF' }}>{selected?.customerName}</strong>
                  </div>
                )}

                {/* Linked Order */}
                <F label="Linked Order (Optional)">
                  {loadingOrders ? (
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Loading customer orders...</div>
                  ) : (
                    <select
                      className="form-input"
                      value={form.orderId || ''}
                      onChange={(e) => handleOrderSelect(e.target.value)}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    >
                      <option value="">-- No Specific Order / General Issue --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Order #{o.id} ({o.orderStatus}) — Rs. {Number(o.totalPrice || 0).toFixed(2)}
                          {o.createdAt ? ` • ${new Date(o.createdAt).toLocaleDateString()}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </F>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <F label="Category" required>
                    <select
                      className="form-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </F>

                  <F label="Priority" required>
                    <select
                      className="form-input"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </F>
                </div>

                {/* Manager Workflow Status & Assigned Staff */}
                {canManageAll && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <F label="Complaint Status">
                      <select
                        className="form-input"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS (Under Investigation)</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </F>

                    <F label="Assigned Employee">
                      <select
                        className="form-input"
                        value={form.assignedEmployeeId || ''}
                        onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value })}
                        style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                      >
                        <option value="">-- Unassigned --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.role?.replace(/_/g, ' ')})
                          </option>
                        ))}
                      </select>
                    </F>
                  </div>
                )}

                <F label="Subject" required>
                  <input
                    type="text"
                    className="form-input"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    required
                  />
                </F>

                <F label="Description" required>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    required
                  />
                </F>

                {/* Resolution Notes (if Manager or if already has resolution) */}
                {(canManageAll || form.resolution) && (
                  <F label="Resolution & Investigation Notes">
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Document root cause, corrective actions, or customer compensation..."
                      value={form.resolution || ''}
                      onChange={(e) => setForm({ ...form, resolution: e.target.value })}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    />
                  </F>
                )}
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN EMPLOYEE MODAL */}
      {modal === 'assign' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.4)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUserCheck /> Assign Staff to Complaint #{selected?.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: '1rem 0 0 0' }}>{error}</div>
            )}

            <form onSubmit={handleAssign}>
              <div style={{ padding: '1.25rem 0' }}>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Assigning a staff member starts the formal investigation and moves ticket status to <strong>Under Investigation (IN_PROGRESS)</strong>.
                </p>

                <F label="Select Staff Member" required>
                  <select
                    className="form-input"
                    value={assignEmployeeId}
                    onChange={(e) => setAssignEmployeeId(e.target.value)}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} • {emp.role?.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </F>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Assigning...' : 'Assign & Start Investigation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE COMPLAINT MODAL */}
      {modal === 'resolve' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.4)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCheckCircle /> Resolve Complaint #{selected?.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: '1rem 0 0 0' }}>{error}</div>
            )}

            <form onSubmit={handleResolve}>
              <div style={{ padding: '1.25rem 0' }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#CBD5E1'
                }}>
                  <div><strong>Customer:</strong> {selected?.customerName}</div>
                  <div><strong>Issue:</strong> {selected?.subject}</div>
                </div>

                <F label="Investigation Findings & Resolution" required>
                  <textarea
                    className="form-input"
                    rows={4}
                    required
                    placeholder="Document root cause (e.g. machine calibration issue) and corrective action taken (e.g. re-washed garments free of charge or refunded Rs. 500)..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: 'rgba(34, 197, 94, 0.4)' }}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ backgroundColor: '#22C55E' }}>
                  {saving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE COMPLAINT MODAL */}
      {modal === 'close' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.3)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCheckSquare /> Close Ticket #{selected?.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            <div style={{ padding: '1.25rem 0' }}>
              <p style={{ color: '#E2E8F0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Are you ready to permanently close this complaint ticket? Once closed, the ticket is archived.
              </p>

              <F label="Closing Remarks (Optional)">
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Customer confirmed satisfaction via phone follow-up."
                  value={closeRemarks}
                  onChange={(e) => setCloseRemarks(e.target.value)}
                  style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                />
              </F>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleClose}>
                {saving ? 'Closing...' : 'Close Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className="modal-title" style={{ color: '#FFFFFF', margin: 0 }}>
                  Complaint #{selected.id}
                </h3>
                <span className={`badge ${STATUS_CONFIG[selected.status]?.badge || 'badge-neutral'}`}>
                  {STATUS_CONFIG[selected.status]?.label || selected.status}
                </span>
                <span className={`badge ${PRIORITY_CONFIG[selected.priority]?.badge || 'badge-info'}`}>
                  {selected.priority}
                </span>
              </div>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            <div style={{ padding: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Category & Order Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Category</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                    {selected.category?.replace(/_/g, ' ') || 'OTHER'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Linked Order</div>
                  <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.9rem' }}>
                    {selected.orderId ? `Order #${selected.orderId}` : 'None'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Customer</div>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.9rem' }}>
                    {selected.customerName}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Assigned Staff</div>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.9rem' }}>
                    {selected.assignedEmployeeName || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Subject & Description */}
              <div>
                <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '6px' }}>
                  {selected.subject}
                </div>
                <div style={{
                  color: '#CBD5E1',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  backgroundColor: '#0F172A',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selected.description}
                </div>
              </div>

              {/* Resolution Notes (if any) */}
              {selected.resolution && (
                <div>
                  <div style={{ fontWeight: 700, color: '#22C55E', fontSize: '0.9rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCheckCircle /> Investigation Findings & Resolution
                  </div>
                  <div style={{
                    color: '#E2E8F0',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selected.resolution}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#64748B', fontSize: '0.78rem', paddingTop: '8px' }}>
                <div>Filed: {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : 'N/A'}</div>
                {selected.resolvedAt && <div>Resolved: {new Date(selected.resolvedAt).toLocaleString()}</div>}
                {selected.closedAt && <div>Closed: {new Date(selected.closedAt).toLocaleString()}</div>}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            style={{ maxWidth: 440, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#EF4444' }}>🗑️ Delete Complaint</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>
            <p style={{ color: '#CBD5E1', padding: '1.25rem 0', margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete Complaint #{selected?.id}? This action cannot be undone.
            </p>
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" disabled={saving} onClick={handleDelete}>
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
