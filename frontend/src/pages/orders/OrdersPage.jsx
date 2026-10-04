import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiShoppingBag, FiPlus, FiEye, FiEdit2, 
  FiTrash2, FiRefreshCw, FiSearch, FiCheck, FiX, FiClock,
  FiFilter, FiUser, FiMapPin, FiCalendar, FiDollarSign, FiTag, FiFileText
} from 'react-icons/fi';

const STATUS_COLOR = {
  PLACED: 'badge-warning',
  RECEIVED: 'badge-info',
  ASSIGNED: 'badge-info',
  PROCESSING: 'badge-primary',
  IN_WASH: 'badge-primary',
  READY: 'badge-success',
  OUT_FOR_DELIVERY: 'badge-warning',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-error'
};

const ALLOWED_TRANSITIONS = {
  PLACED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['ASSIGNED', 'PROCESSING', 'CANCELLED'],
  ASSIGNED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['IN_WASH', 'READY', 'CANCELLED'],
  IN_WASH: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Lookup Data
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);

  // Modals: null | 'create' | 'view' | 'edit' | 'status' | 'cancel'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Status Modal State
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Create Order Form State
  const [createForm, setCreateForm] = useState({
    customerId: '',
    branchId: '',
    items: [{ serviceId: '', quantity: 1, specialInstruction: '' }],
    discount: 0,
    paymentMethod: 'CASH',
    specialInstructions: '',
    requestPickup: false,
    pickupAddress: '',
    pickupDate: '',
    pickupTimeSlot: '10:00 AM - 12:00 PM'
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    specialInstructions: '',
    pickupAddress: '',
    pickupDate: '',
    pickupTimeSlot: '',
    items: []
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const isCustomer = user?.role === 'CUSTOMER';
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER' || isAdmin;

  // Load Lookups on mount
  useEffect(() => {
    if (isManager) {
      api.get('/customers', { params: { size: 100 } })
        .then(r => setCustomers(r.data?.content || []))
        .catch(() => {});
      api.get('/branches')
        .then(r => setBranches(r.data || []))
        .catch(() => {});
    }
    api.get('/services/available')
      .then(r => setServices(r.data || []))
      .catch(() => {});
  }, [isManager]);

  // Load Orders with Server-side & Client-side Filters
  const load = () => {
    setLoading(true);
    setError('');
    const endpoint = isCustomer ? '/orders/my' : '/orders';
    const params = { size: 100 };
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    if (branchFilter && isAdmin) params.branchId = branchFilter;
    if (search.trim()) params.search = search.trim();

    api.get(endpoint, { params })
      .then(r => setOrders(r.data?.content || []))
      .catch(err => {
        console.error(err);
        setError('Failed to load orders. Please try refreshing.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user, statusFilter, dateFilter, branchFilter]);

  // Quick Client-side search for instantaneous feedback
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const term = search.toLowerCase();
    return orders.filter(o => {
      const idStr = String(o.id);
      const custName = o.customer?.fullName?.toLowerCase() || '';
      const email = o.customer?.email?.toLowerCase() || '';
      const phone = o.customer?.phoneNumber || '';
      const statusStr = (o.orderStatus || '').toLowerCase();
      const servicesStr = (o.items || []).map(i => i.serviceName).join(' ').toLowerCase();
      return idStr.includes(term) || custName.includes(term) || email.includes(term) || phone.includes(term) || statusStr.includes(term) || servicesStr.includes(term);
    });
  }, [orders, search]);

  const canEdit = (o) => ['PLACED', 'RECEIVED'].includes(o.orderStatus);
  const canCancel = (o) => ['PLACED', 'RECEIVED'].includes(o.orderStatus);
  const canUpdateStatus = (o) => isManager && (ALLOWED_TRANSITIONS[o.orderStatus]?.length > 0);

  // Modal Open Handlers
  const openCreateModal = () => {
    setCreateForm({
      customerId: customers[0]?.id || '',
      branchId: user?.branchId || branches[0]?.id || 1,
      items: [{ serviceId: services[0]?.id || '', quantity: 1, specialInstruction: '' }],
      discount: 0,
      paymentMethod: 'CASH',
      specialInstructions: '',
      requestPickup: false,
      pickupAddress: '',
      pickupDate: '',
      pickupTimeSlot: '10:00 AM - 12:00 PM'
    });
    setError('');
    setModal('create');
  };

  const openViewModal = (o) => {
    setSelected(o);
    setModal('view');
  };

  const openStatus = (o) => {
    setSelected(o);
    setNewStatus(ALLOWED_TRANSITIONS[o.orderStatus]?.[0] || '');
    setStatusRemarks('');
    setError('');
    setModal('status');
  };

  const openCancel = (o) => {
    setSelected(o);
    setError('');
    setModal('cancel');
  };

  const openEdit = (o) => {
    setSelected(o);
    setError('');
    setEditForm({
      specialInstructions: o.specialInstructions || '',
      pickupAddress: o.pickup?.pickupAddress || '',
      pickupDate: o.pickup?.pickupDate || '',
      pickupTimeSlot: o.pickup?.pickupTimeSlot || '10:00 AM - 12:00 PM',
      items: (o.items || []).map(it => ({
        serviceId: it.serviceId,
        serviceName: it.serviceName,
        quantity: it.quantity || 1,
        specialInstruction: it.specialInstruction || ''
      }))
    });
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
  };

  // Calculations for Create Form
  const createSubtotal = useMemo(() => {
    return createForm.items.reduce((sum, it) => {
      const svc = services.find(s => String(s.id) === String(it.serviceId));
      const price = svc ? svc.price : 0;
      const qty = Number(it.quantity) || 0;
      return sum + (price * qty);
    }, 0);
  }, [createForm.items, services]);

  const createTotal = useMemo(() => {
    const disc = Number(createForm.discount) || 0;
    return Math.max(0, createSubtotal - disc);
  }, [createSubtotal, createForm.discount]);

  // Create Order Item Helpers
  const addCreateItem = () => {
    setCreateForm(prev => ({
      ...prev,
      items: [...prev.items, { serviceId: services[0]?.id || '', quantity: 1, specialInstruction: '' }]
    }));
  };

  const removeCreateItem = (idx) => {
    if (createForm.items.length <= 1) return;
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateCreateItem = (idx, field, val) => {
    setCreateForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, items };
    });
  };

  // Submit Create Order
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.items.length || createForm.items.some(it => !it.serviceId || Number(it.quantity) <= 0)) {
      setError('Please add at least one valid service with quantity.');
      return;
    }
    if (isManager && !createForm.customerId && !isCustomer) {
      setError('Please select an existing customer for this order.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        customerId: isCustomer ? undefined : Number(createForm.customerId),
        branchId: Number(createForm.branchId || user?.branchId || 1),
        items: createForm.items.map(it => ({
          serviceId: Number(it.serviceId),
          quantity: Number(it.quantity),
          specialInstruction: it.specialInstruction || undefined
        })),
        discount: Number(createForm.discount) || 0,
        paymentMethod: createForm.paymentMethod,
        specialInstructions: createForm.specialInstructions || undefined,
        requestPickup: createForm.requestPickup,
        pickupAddress: createForm.requestPickup ? createForm.pickupAddress : undefined,
        pickupDate: createForm.requestPickup ? createForm.pickupDate : undefined,
        pickupTimeSlot: createForm.requestPickup ? createForm.pickupTimeSlot : undefined
      };

      const res = await api.post('/orders', payload);
      toast.success(`Order #${res.data?.id || ''} created successfully!`);
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  // Status Transition Submit
  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/orders/${selected.id}/status`, { 
        status: newStatus,
        remarks: statusRemarks.trim() || undefined
      });
      toast.success(`Order #${selected.id} status updated to ${newStatus}!`);
      closeModal();
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = async () => {
    setSaving(true);
    setError('');
    try {
      await api.delete(`/orders/${selected.id}`);
      toast.success(`Order #${selected.id} cancelled successfully.`);
      closeModal();
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to cancel order');
    } finally {
      setSaving(false);
    }
  };

  // Edit Order Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        specialInstructions: editForm.specialInstructions,
        pickupAddress: editForm.pickupAddress || undefined,
        pickupDate: editForm.pickupDate || undefined,
        pickupTimeSlot: editForm.pickupTimeSlot || undefined,
        items: editForm.items.map(it => ({
          serviceId: it.serviceId,
          quantity: Number(it.quantity),
          specialInstruction: it.specialInstruction
        }))
      };
      await api.put(`/orders/${selected.id}`, payload);
      toast.success('Order details updated successfully!');
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFilter('');
    setBranchFilter('');
  };

  const hasActiveFilters = search || statusFilter || dateFilter || branchFilter;

  return (
    <div style={{ padding: '0 0.5rem 2.5rem 0.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FiShoppingBag style={{ color: '#FF6B00' }} /> {isCustomer ? 'My Orders' : (isManager && !isAdmin ? 'Branch Orders' : 'Order Management')}
            </h1>
            {isManager && !isAdmin && user?.branchId && (
              <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255, 107, 0, 0.15)', color: '#FF8C38', border: '1px solid rgba(255, 107, 0, 0.3)', fontWeight: 600 }}>
                {branches.find(b => b.id === user.branchId)?.branchName || `Branch #${user.branchId}`}
              </span>
            )}
          </div>
          <p style={{ color: '#A0A0B0', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {isCustomer 
              ? 'Track, edit, or manage your personal laundry bookings.' 
              : (isManager && !isAdmin 
                  ? 'Manage incoming bookings, tracking, and operational workflow for your assigned branch.' 
                  : 'Complete end-to-end laundry order intake, tracking, workflow, and lifecycle.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={load} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiRefreshCw /> Refresh
          </button>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiPlus /> Create Order
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888899' }} />
            <input
              type="text"
              placeholder="Search ID, customer, phone, item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">All Statuses</option>
              <option value="PLACED">PLACED</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="READY">READY</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ width: '100%' }}
              title="Filter by Order Date"
            />
          </div>

          {/* Branch Filter (Admin Only) */}
          {isAdmin && (
            <div>
              <select
                className="form-input"
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-outline"
                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
              >
                <FiX /> Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="card-glass" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#A0A0B0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading orders...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #2a3648' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3648', background: 'rgba(30, 41, 59, 0.85)' }}>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #2a3648' }}>Order ID</th>
                  {!isCustomer && <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #2a3648' }}>Customer</th>}
                  {isAdmin && <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #2a3648' }}>Branch</th>}
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #2a3648' }}>Services / Items</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #2a3648' }}>Total Amount</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #2a3648' }}>Order Status</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #2a3648' }}>Date</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', borderBottom: '1px solid #2a3648' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={isCustomer ? 6 : (isAdmin ? 8 : 7)} style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#1e293b' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧺</div>
                      <h3 style={{ color: '#FFFFFF', margin: '0 0 0.5rem 0', fontWeight: 700 }}>No orders found</h3>
                      <p style={{ color: '#888899', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
                        {hasActiveFilters ? "No orders match the selected filters or search criteria." : "No orders recorded in the system yet."}
                      </p>
                      <button onClick={openCreateModal} className="btn btn-primary">
                        Create An Order Now
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #2a3648', backgroundColor: '#1e293b', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle' }}>
                        <button
                          onClick={() => openViewModal(o)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#FF6B00',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.95rem'
                          }}
                        >
                          #{o.id}
                        </button>
                      </td>
                      {!isCustomer && (
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{o.customer?.fullName || 'Walk-in Customer'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888899' }}>{o.customer?.phoneNumber || o.customer?.email || ''}</div>
                        </td>
                      )}
                      {isAdmin && (
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                            {branches.find(b => b.id === o.branchId)?.branchName || `Branch #${o.branchId}`}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '0.85rem', color: '#E0E0E0' }}>
                          {(o.items || []).map(i => `${i.serviceName} (×${i.quantity})`).join(', ') || 'Laundry Service'}
                        </div>
                        {o.specialInstructions && (
                          <div style={{ fontSize: '0.75rem', color: '#888899', marginTop: '2px' }}>
                            Note: {o.specialInstructions}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle', fontWeight: 700, color: '#22C55E', whiteSpace: 'nowrap' }}>
                        Rs. {(o.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle' }}>
                        <span className={`badge ${STATUS_COLOR[o.orderStatus] || 'badge-neutral'}`}>
                          {(o.orderStatus || 'PLACED').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle', color: '#888899', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {o.orderDate || o.createdAt ? new Date(o.orderDate || o.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #2a3648', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {/* View Button */}
                          <button
                            onClick={() => openViewModal(o)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="View Details"
                          >
                            <FiEye /> View
                          </button>

                          {/* Edit Button (Customer or Manager if PLACED / RECEIVED) */}
                          {canEdit(o) && (
                            <button
                              onClick={() => openEdit(o)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#60A5FA', borderColor: 'rgba(96,165,250,0.3)' }}
                              title="Edit Order"
                            >
                              <FiEdit2 /> Edit
                            </button>
                          )}

                          {/* Cancel Button (Customer or Manager if PLACED / RECEIVED) */}
                          {canCancel(o) && (
                            <button
                              onClick={() => openCancel(o)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                              title="Cancel Order"
                            >
                              <FiTrash2 /> Cancel
                            </button>
                          )}

                          {/* Status Progression Button (Manager only) */}
                          {canUpdateStatus(o) && (
                            <button
                              onClick={() => openStatus(o)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Advance Status"
                            >
                              Status
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ORDER MODAL */}
      {modal === 'create' && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '680px', 
              background: '#161f30', 
              border: '1px solid rgba(249, 115, 22, 0.35)', 
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f97316'
                }}>
                  <FiPlus size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF' }}>Create New Laundry Order</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Select customer, services, quantities, apply discounts and book order.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <FiX size={16} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              {/* Customer & Branch Selection (Staff/Manager/Admin) */}
              {!isCustomer && (
                <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.5fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                      <FiUser style={{ display: 'inline', marginRight: '4px' }} /> Select Customer <span style={{ color: '#f97316' }}>*</span>
                    </label>
                    <select
                      className="form-input"
                      required
                      value={createForm.customerId}
                      onChange={e => setCreateForm({ ...createForm, customerId: e.target.value })}
                    >
                      <option value="">Select Existing Customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phoneNumber || c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {isAdmin && (
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                        <FiMapPin style={{ display: 'inline', marginRight: '4px' }} /> Select Branch <span style={{ color: '#f97316' }}>*</span>
                      </label>
                      <select
                        className="form-input"
                        required
                        value={createForm.branchId}
                        onChange={e => setCreateForm({ ...createForm, branchId: e.target.value })}
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.branchName} ({b.branchCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Service Items Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiTag style={{ color: '#f97316' }} /> Service Items ({createForm.items.length})
                </label>
                <button
                  type="button"
                  onClick={addCreateItem}
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <FiPlus /> Add Item
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {createForm.items.map((it, idx) => {
                  const selectedSvc = services.find(s => String(s.id) === String(it.serviceId));
                  const itemPrice = selectedSvc ? selectedSvc.price : 0;
                  const itemSubtotal = itemPrice * (Number(it.quantity) || 0);

                  return (
                    <div 
                      key={idx} 
                      style={{
                        background: '#0d1524',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '10px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Service</label>
                          <select
                            className="form-input"
                            value={it.serviceId}
                            onChange={e => updateCreateItem(idx, 'serviceId', e.target.value)}
                            required
                          >
                            <option value="">Select Service...</option>
                            {services.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.serviceName} (Rs. {s.price})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Qty / Weight</label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            className="form-input"
                            value={it.quantity}
                            onChange={e => updateCreateItem(idx, 'quantity', e.target.value)}
                            required
                          />
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Subtotal</label>
                          <span style={{ fontWeight: 700, color: '#f97316', fontSize: '0.95rem' }}>
                            Rs. {itemSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {createForm.items.length > 1 && (
                          <div style={{ paddingTop: '18px' }}>
                            <button
                              type="button"
                              onClick={() => removeCreateItem(idx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                              title="Remove item"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Special item note (optional, e.g. delicate, separate colors)..."
                          value={it.specialInstruction}
                          onChange={e => updateCreateItem(idx, 'specialInstruction', e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal, Discount & Order Total Calculation Box */}
              <div 
                style={{ 
                  background: 'rgba(249, 115, 22, 0.08)', 
                  border: '1px solid rgba(249, 115, 22, 0.25)', 
                  borderRadius: '12px', 
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Items Subtotal:</span>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>Rs. {createSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Discount (Rs.):</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={createForm.discount}
                    onChange={e => setCreateForm({ ...createForm, discount: Math.max(0, Number(e.target.value)) })}
                    style={{
                      width: '120px',
                      background: '#0d1524',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#ffffff',
                      textAlign: 'right',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Net Order Total:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>
                    Rs. {createTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Pickup & Payment Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Payment Method</label>
                  <select
                    className="form-input"
                    value={createForm.paymentMethod}
                    onChange={e => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                  >
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="DIGITAL_PAYMENT">DIGITAL PAYMENT</option>
                    <option value="CASH_ON_DELIVERY">CASH ON DELIVERY</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                    Special Instructions
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Deliver before 5 PM, wash cold"
                    value={createForm.specialInstructions}
                    onChange={e => setCreateForm({ ...createForm, specialInstructions: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
                <button type="button" onClick={closeModal} className="btn btn-outline" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || createSubtotal <= 0}>
                  {saving ? 'Saving Order...' : 'Save & Book Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {modal === 'view' && selected && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '650px', 
              background: '#161f30', 
              border: '1px solid rgba(249, 115, 22, 0.35)', 
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>Order #{selected.id}</h2>
                  <span className={`badge ${STATUS_COLOR[selected.orderStatus] || 'badge-neutral'}`}>
                    {(selected.orderStatus || '').replace(/_/g, ' ')}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Placed on {selected.orderDate ? new Date(selected.orderDate).toLocaleString() : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Customer & Branch Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#0d1524', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Customer</div>
                <div style={{ fontWeight: 600, color: '#ffffff' }}>{selected.customer?.fullName || 'Walk-in Customer'}</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{selected.customer?.phoneNumber || 'No phone'}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selected.customer?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Branch & Staff</div>
                <div style={{ fontWeight: 600, color: '#ffffff' }}>
                  {branches.find(b => b.id === selected.branchId)?.branchName || `Branch #${selected.branchId}`}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Intake: {selected.receptionistName ? `Staff (${selected.receptionistName})` : 'Online Customer Booking'}
                </div>
              </div>
            </div>

            {/* Service Items Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff', fontSize: '0.95rem' }}>Order Items</h4>
              <div style={{ border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#0d1524', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8' }}>Service</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>Rate</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items || []).map((it, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <td style={{ padding: '8px 12px', color: '#ffffff' }}>
                          <div>{it.serviceName}</div>
                          {it.specialInstruction && <div style={{ fontSize: '0.75rem', color: '#888899' }}>{it.specialInstruction}</div>}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#cbd5e1' }}>Rs. {it.unitPrice}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#cbd5e1' }}>{it.quantity}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#f97316' }}>
                          Rs. {(it.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1524', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Payment Status: </span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{selected.payment?.paymentStatus || 'PENDING'}</span>
                <span style={{ fontSize: '0.8rem', color: '#888899', marginLeft: '8px' }}>({selected.payment?.paymentMethod || 'CASH'})</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginRight: '8px' }}>Total Amount:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>
                  Rs. {(selected.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => navigate(`/orders/${selected.id}`)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Open Full Order Page →
              </button>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {canEdit(selected) && (
                  <button type="button" onClick={() => { closeModal(); openEdit(selected); }} className="btn btn-outline">
                    Edit Order
                  </button>
                )}
                <button type="button" onClick={closeModal} className="btn btn-primary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {modal === 'edit' && selected && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '560px', 
              background: '#161f30', 
              border: '1px solid rgba(249, 115, 22, 0.35)', 
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              position: 'relative'
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 700 }}>
              ✏️ Edit Order #{selected.id}
            </h3>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Special Instructions</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={editForm.specialInstructions}
                  onChange={e => setEditForm({ ...editForm, specialInstructions: e.target.value })}
                  placeholder="e.g. Wash cold, delicate fabric..."
                />
              </div>

              {selected.pickup && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Pickup Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.pickupAddress}
                    onChange={e => setEditForm({ ...editForm, pickupAddress: e.target.value })}
                  />
                </div>
              )}

              {/* Items Quantity Adjustments */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Item Quantities</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {editForm.items.map((it, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#0d1524',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148,163,184,0.15)'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>{it.serviceName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888899' }}>Qty:</span>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          className="form-input"
                          style={{ width: '80px', padding: '4px 8px', textAlign: 'center' }}
                          value={it.quantity}
                          onChange={e => {
                            const newItems = [...editForm.items];
                            newItems[idx].quantity = e.target.value;
                            setEditForm({ ...editForm, items: newItems });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={closeModal} className="btn btn-outline" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {modal === 'cancel' && selected && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '440px', 
              background: '#161f30', 
              border: '1px solid rgba(239, 68, 68, 0.35)', 
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9)'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', color: '#EF4444', fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiTrash2 /> Cancel Order #{selected.id}?
            </h3>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <p style={{ color: '#D0D0E0', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to cancel Order #{selected.id}? This will cancel any pending laundry pickups and release the customer's payment obligations.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={closeModal} className="btn btn-outline" disabled={saving}>
                Go Back
              </button>
              <button type="button" onClick={handleCancelOrder} className="btn btn-danger" disabled={saving}>
                {saving ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCE STATUS MODAL */}
      {modal === 'status' && selected && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '460px', 
              background: '#161f30', 
              border: '1px solid rgba(249, 115, 22, 0.35)', 
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9)'
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 700 }}>
              Update Status for Order #{selected.id}
            </h3>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Next Order Status (Strict Workflow)</label>
              <select
                className="form-input"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                {ALLOWED_TRANSITIONS[selected.orderStatus]?.map(st => (
                  <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Remarks / Note (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Washing cycle complete, sent to iron desk"
                value={statusRemarks}
                onChange={e => setStatusRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={closeModal} className="btn btn-outline" disabled={saving}>
                Cancel
              </button>
              <button type="button" onClick={handleStatusUpdate} className="btn btn-primary" disabled={saving || !newStatus}>
                {saving ? 'Updating...' : 'Confirm Status Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
