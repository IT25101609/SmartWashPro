import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiTruck, FiPlus, FiRefreshCw, FiCheck, FiX, FiClock,
  FiCalendar, FiMapPin, FiUser, FiPhone, FiMail, FiSearch,
  FiEye, FiAlertCircle, FiFilter, FiCheckCircle, FiArrowRight,
  FiPackage, FiDollarSign, FiUserCheck
} from 'react-icons/fi';

const STATUS_COLOR = {
  REQUESTED: 'badge-info',
  SCHEDULED: 'badge-warning',
  ASSIGNED: 'badge-primary',
  COLLECTED: 'badge-success',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-error'
};

const STATUS_BADGE_STYLE = {
  REQUESTED: { background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' },
  SCHEDULED: { background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' },
  ASSIGNED: { background: 'rgba(255, 107, 0, 0.15)', color: '#FF8C38', border: '1px solid rgba(255, 107, 0, 0.35)' },
  COLLECTED: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.3)' },
  COMPLETED: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.3)' },
  CANCELLED: { background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' }
};

const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00'
];

export default function PickupsPage() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const isStaff = ['ADMIN', 'BRANCH_MANAGER_ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST'].includes(user?.role);

  // Data states
  const [pickups, setPickups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals: null | 'create' | 'details' | 'assign' | 'collect' | 'cancel'
  const [modal, setModal] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(null);

  // Form states for Create Pickup
  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    pickupAddress: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTimeSlot: TIME_SLOTS[0],
    driverId: '',
    specialInstruction: ''
  });

  // Assign Driver modal state
  const [assignDriverId, setAssignDriverId] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 1. Load Pickups with optional query params
  const loadPickups = () => {
    setLoading(true);
    const endpoint = isCustomer ? '/pickups/my' : '/pickups';
    const params = { size: 100 };
    if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    if (search.trim()) params.search = search.trim();

    api.get(endpoint, { params })
      .then(res => {
        setPickups(res.data?.content || []);
      })
      .catch(err => {
        console.error('Failed to load pickups:', err);
        toast.error('Failed to load pickup requests');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPickups();
  }, [user, statusFilter, dateFilter]);

  // Handle Search on enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPickups();
  };

  // 2. Load supporting data (drivers, customers, eligible orders)
  const loadSupportingData = async () => {
    try {
      if (isStaff) {
        // Fetch Drivers
        api.get('/pickups/drivers').then(r => setDrivers(r.data || [])).catch(() => {});
        // Fetch Customers
        api.get('/customers', { params: { size: 100 } }).then(r => setCustomers(r.data?.content || [])).catch(() => {});
      }
      // Fetch Eligible Orders
      api.get('/pickups/eligible-orders').then(r => setEligibleOrders(r.data || [])).catch(() => {});
    } catch (err) {
      console.error('Error fetching supporting data:', err);
    }
  };

  useEffect(() => {
    loadSupportingData();
  }, [user, isStaff]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = pickups.length;
    const requested = pickups.filter(p => p.pickupStatus === 'REQUESTED' || p.pickupStatus === 'SCHEDULED').length;
    const assigned = pickups.filter(p => p.pickupStatus === 'ASSIGNED').length;
    const collected = pickups.filter(p => p.pickupStatus === 'COLLECTED' || p.pickupStatus === 'COMPLETED').length;
    const cancelled = pickups.filter(p => p.pickupStatus === 'CANCELLED').length;
    return { total, requested, assigned, collected, cancelled };
  }, [pickups]);

  // Quick Action Handlers
  const openCreateModal = () => {
    loadSupportingData();
    const defaultAddress = user?.address || '';
    setForm({
      customerId: '',
      orderId: '',
      pickupAddress: defaultAddress,
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTimeSlot: TIME_SLOTS[0],
      driverId: '',
      specialInstruction: ''
    });
    setError('');
    setModal('create');
  };

  const openDetailsModal = (pickup) => {
    setSelectedPickup(pickup);
    setError('');
    setModal('details');
  };

  const openAssignModal = (pickup) => {
    setSelectedPickup(pickup);
    setAssignDriverId(pickup.driverId ? String(pickup.driverId) : '');
    setError('');
    setModal('assign');
  };

  const openCollectModal = (pickup) => {
    setSelectedPickup(pickup);
    setError('');
    setModal('collect');
  };

  const openCancelModal = (pickup) => {
    setSelectedPickup(pickup);
    setError('');
    setModal('cancel');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedPickup(null);
    setError('');
    setSaving(false);
  };

  // Customer selection change in Create form
  const handleCustomerChange = (customerId) => {
    const cid = customerId ? parseInt(customerId) : '';
    const selectedCust = customers.find(c => c.id === cid);
    const newAddress = selectedCust?.address || form.pickupAddress;
    setForm(prev => ({
      ...prev,
      customerId: cid,
      orderId: '',
      pickupAddress: newAddress
    }));
  };

  // Order selection change in Create form
  const handleOrderChange = (orderId) => {
    const oid = orderId ? parseInt(orderId) : '';
    const selectedOrd = eligibleOrders.find(o => o.id === oid);
    setForm(prev => ({
      ...prev,
      orderId: oid,
      customerId: selectedOrd?.customerId || prev.customerId,
      pickupAddress: selectedOrd?.customerAddress || prev.pickupAddress || ''
    }));
  };

  // Filtered orders for create form
  const availableOrdersForForm = useMemo(() => {
    if (form.customerId) {
      return eligibleOrders.filter(o => o.customerId === form.customerId);
    }
    return eligibleOrders;
  }, [eligibleOrders, form.customerId]);

  // Submit Create Pickup
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId) {
      setError('Please select an active order for this pickup request.');
      return;
    }
    if (!form.pickupAddress?.trim()) {
      setError('Pickup address is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        orderId: parseInt(form.orderId),
        customerId: form.customerId ? parseInt(form.customerId) : undefined,
        pickupAddress: form.pickupAddress.trim(),
        pickupDate: form.pickupDate,
        pickupTimeSlot: form.pickupTimeSlot,
        driverId: form.driverId ? parseInt(form.driverId) : undefined,
        specialInstruction: form.specialInstruction?.trim() || null
      };

      await api.post('/pickups', payload);
      toast.success('Pickup request created successfully!');
      closeModal();
      loadPickups();
      loadSupportingData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create pickup request');
    } finally {
      setSaving(false);
    }
  };

  // Submit Driver Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignDriverId) {
      setError('Please select a delivery driver.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/pickups/${selectedPickup.id}/assign`, {
        driverId: parseInt(assignDriverId)
      });
      toast.success('Driver assigned successfully! Status updated to ASSIGNED.');
      closeModal();
      loadPickups();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to assign driver');
    } finally {
      setSaving(false);
    }
  };

  // Submit Mark as Collected
  const handleCollectSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/pickups/${selectedPickup.id}/collect`);
      toast.success('Pickup marked as COLLECTED! Related order updated to RECEIVED.');
      closeModal();
      loadPickups();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to mark pickup as collected');
    } finally {
      setSaving(false);
    }
  };

  // Submit Cancel Pickup
  const handleCancelSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/pickups/${selectedPickup.id}/cancel`);
      toast.success('Pickup request cancelled successfully.');
      closeModal();
      loadPickups();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to cancel pickup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '0 0.5rem 3rem 0.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            margin: 0,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, rgba(255,107,0,0.2) 0%, rgba(255,107,0,0.05) 100%)',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,107,0,0.3)',
              color: '#FF6B00'
            }}>
              <FiTruck size={24} />
            </span>
            {isCustomer ? 'My Doorstep Pickups' : 'Pickup & Courier Management'}
          </h1>
          <p style={{ color: '#A0A0B0', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            {isCustomer
              ? 'Schedule, manage, and track laundry collection straight from your doorstep.'
              : 'End-to-end dispatch workflow: REQUESTED → ASSIGNED → COLLECTED'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => { loadPickups(); loadSupportingData(); }}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#12121A' }}
            title="Refresh list"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(255,107,0,0.35)'
            }}
          >
            <FiPlus size={18} /> Schedule Pickup
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Pickups */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #FF6B00',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Pickups</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{stats.total}</div>
          </div>
          <div style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', padding: '12px', borderRadius: '10px' }}>
            <FiPackage size={22} />
          </div>
        </div>

        {/* Requested / Pending Dispatch */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #3B82F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Requested</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>{stats.requested}</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', padding: '12px', borderRadius: '10px' }}>
            <FiClock size={22} />
          </div>
        </div>

        {/* Assigned */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #F59E0B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Assigned to Drivers</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>{stats.assigned}</div>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: '#FBBF24', padding: '12px', borderRadius: '10px' }}>
            <FiTruck size={22} />
          </div>
        </div>

        {/* Collected */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #22C55E',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Collected</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4ADE80', marginTop: '4px' }}>{stats.collected}</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', padding: '12px', borderRadius: '10px' }}>
            <FiCheckCircle size={22} />
          </div>
        </div>

        {/* Cancelled */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #EF4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Cancelled</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F87171', marginTop: '4px' }}>{stats.cancelled}</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', padding: '12px', borderRadius: '10px' }}>
            <FiX size={22} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['ALL', 'REQUESTED', 'ASSIGNED', 'COLLECTED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: statusFilter === st ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                  background: statusFilter === st ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.03)',
                  color: statusFilter === st ? '#FF6B00' : '#A0A0B0',
                  fontWeight: statusFilter === st ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>

          {/* Search & Date Filter */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Date filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '150px' }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                title="Filter by Pickup Date"
              />
              {dateFilter && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDateFilter('')}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#EF4444' }}
                  title="Clear Date"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888899' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search Order, Customer, Driver..."
                style={{ paddingLeft: '34px', paddingRight: '12px', fontSize: '0.85rem', width: '240px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* PICKUPS TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#A0A0B0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }}>⏳</div>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading pickup schedules...</p>
        </div>
      ) : (
        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 90 }}>Pickup ID</th>
                  <th style={{ minWidth: 140 }}>Order</th>
                  {!isCustomer && <th style={{ minWidth: 180 }}>Customer</th>}
                  <th style={{ minWidth: 220 }}>Pickup Address</th>
                  <th style={{ minWidth: 160 }}>Scheduled Slot</th>
                  <th style={{ minWidth: 180 }}>Courier / Driver</th>
                  <th style={{ minWidth: 120 }}>Status</th>
                  <th style={{ textAlign: 'right', minWidth: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pickups.map(p => {
                  const isRequested = p.pickupStatus === 'REQUESTED' || p.pickupStatus === 'SCHEDULED';
                  const isAssigned = p.pickupStatus === 'ASSIGNED';
                  const isCollected = p.pickupStatus === 'COLLECTED' || p.pickupStatus === 'COMPLETED';
                  const isCancelled = p.pickupStatus === 'CANCELLED';

                  return (
                    <tr key={p.id} style={{ background: 'rgba(255,255,255,0.015)' }}>
                      {/* ID */}
                      <td style={{ fontWeight: 700, color: '#FF6B00' }}>
                        #PK-{p.id}
                      </td>

                      {/* Order info */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.9rem' }}>
                            Order #{p.orderId}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#A0A0B0', marginTop: '2px' }}>
                            Rs. {(p.orderTotalPrice || 0).toLocaleString()} • {p.orderStatus}
                          </span>
                        </div>
                      </td>

                      {/* Customer info */}
                      {!isCustomer && (
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{p.customerName || 'Customer'}</span>
                            {p.customerPhone && (
                              <span style={{ fontSize: '0.8rem', color: '#888899', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <FiPhone size={11} /> {p.customerPhone}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Pickup Address */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', maxWidth: '240px' }}>
                          <FiMapPin size={14} style={{ color: '#FF6B00', marginTop: '3px', flexShrink: 0 }} />
                          <span style={{
                            color: '#E0E0EE',
                            fontSize: '0.85rem',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={p.pickupAddress}>
                            {p.pickupAddress || 'No address specified'}
                          </span>
                        </div>
                      </td>

                      {/* Date & Time Slot */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FiCalendar size={12} style={{ color: '#60A5FA' }} /> {p.pickupDate || 'Date pending'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#888899', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FiClock size={12} /> {p.pickupTimeSlot || '08:00 - 10:00'}
                          </span>
                        </div>
                      </td>

                      {/* Driver */}
                      <td>
                        {p.driverName ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4ADE80', fontWeight: 600, fontSize: '0.85rem' }}>
                              <FiTruck size={13} /> {p.driverName}
                            </span>
                            {p.driverPhone && (
                              <span style={{ fontSize: '0.75rem', color: '#888899', marginTop: '2px' }}>
                                {p.driverPhone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#FBBF24',
                            background: 'rgba(245,158,11,0.1)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600
                          }}>
                            <FiAlertCircle size={12} /> Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            ...(STATUS_BADGE_STYLE[p.pickupStatus] || STATUS_BADGE_STYLE.REQUESTED)
                          }}
                        >
                          {p.pickupStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {/* View Details */}
                          <button
                            className="btn btn-outline"
                            onClick={() => openDetailsModal(p)}
                            style={{ padding: '5px 9px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="View Pickup Details"
                          >
                            <FiEye size={12} /> Details
                          </button>

                          {/* Assign Driver (Staff only, when not collected/cancelled) */}
                          {isStaff && !isCollected && !isCancelled && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => openAssignModal(p)}
                              style={{ padding: '5px 9px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Assign Delivery Driver"
                            >
                              <FiTruck size={12} /> {p.driverId ? 'Reassign' : 'Assign'}
                            </button>
                          )}

                          {/* Mark Collected (Staff & Driver, when assigned or requested) */}
                          {isStaff && (isAssigned || isRequested) && (
                            <button
                              className="btn btn-primary"
                              onClick={() => openCollectModal(p)}
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#22C55E',
                                borderColor: '#22C55E'
                              }}
                              title="Mark as Collected"
                            >
                              <FiCheck size={12} /> Collect
                            </button>
                          )}

                          {/* Cancel Pickup (When requested or assigned) */}
                          {!isCollected && !isCancelled && (
                            <button
                              className="btn btn-outline"
                              onClick={() => openCancelModal(p)}
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.78rem',
                                color: '#EF4444',
                                borderColor: 'rgba(239,68,68,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Cancel Pickup"
                            >
                              <FiX size={12} /> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!pickups.length && (
                  <tr>
                    <td colSpan={isCustomer ? 7 : 8} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#64748B' }}>🚚</div>
                      <h3 style={{ color: '#FFFFFF', margin: '0 0 0.5rem 0', fontWeight: 700 }}>No Pickups Found</h3>
                      <p style={{ color: '#888899', fontSize: '0.9rem', margin: '0 0 1.5rem 0', maxWidth: '400px', marginInline: 'auto' }}>
                        {isCustomer
                          ? 'You currently have no scheduled pickups matching your search filters.'
                          : 'No pickup requests match your search or filter criteria.'}
                      </p>
                      <button onClick={openCreateModal} className="btn btn-primary" style={{ fontWeight: 600 }}>
                        <FiPlus /> Schedule New Pickup
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / SCHEDULE PICKUP */}
      {modal === 'create' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '1rem'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '540px', padding: '2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#FF6B00' }}><FiTruck /></span> Schedule Doorstep Pickup
              </h3>
              <button
                className="btn btn-icon"
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: '#888899', cursor: 'pointer', fontSize: '1.3rem' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Customer Selector (Staff only) */}
                {isStaff && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiUser size={13} style={{ color: '#FF6B00' }} /> Customer
                    </label>
                    <select
                      className="form-input"
                      value={form.customerId}
                      onChange={e => handleCustomerChange(e.target.value)}
                    >
                      <option value="">— Select Customer (Optional filter) —</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phoneNumber || c.email || `ID: #${c.id}`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Related Order Selector */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiPackage size={13} style={{ color: '#FF6B00' }} /> Related Order *
                  </label>
                  <select
                    className="form-input"
                    required
                    value={form.orderId}
                    onChange={e => handleOrderChange(e.target.value)}
                  >
                    <option value="">— Select active order to collect —</option>
                    {availableOrdersForForm.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} — Rs. {(o.totalPrice || 0).toLocaleString()} ({o.orderStatus}) • {o.customerName}
                      </option>
                    ))}
                  </select>
                  {availableOrdersForForm.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '4px', display: 'block' }}>
                      ℹ️ No active unassigned orders found for pickup. Place an order first if needed.
                    </span>
                  )}
                </div>

                {/* Pickup Address */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiMapPin size={13} style={{ color: '#FF6B00' }} /> Pickup Address *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Enter full street address for courier collection"
                    value={form.pickupAddress}
                    onChange={e => setForm({ ...form, pickupAddress: e.target.value })}
                  />
                </div>

                {/* Date & Time Slot in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiCalendar size={13} style={{ color: '#FF6B00' }} /> Pickup Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={form.pickupDate}
                      onChange={e => setForm({ ...form, pickupDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiClock size={13} style={{ color: '#FF6B00' }} /> Time Window *
                    </label>
                    <select
                      className="form-input"
                      value={form.pickupTimeSlot}
                      onChange={e => setForm({ ...form, pickupTimeSlot: e.target.value })}
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Driver Assignment (Staff only) */}
                {isStaff && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiTruck size={13} style={{ color: '#FF6B00' }} /> Assign Courier Driver (Optional)
                    </label>
                    <select
                      className="form-input"
                      value={form.driverId}
                      onChange={e => setForm({ ...form, driverId: e.target.value })}
                    >
                      <option value="">— Unassigned (Will set status to REQUESTED) —</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.phoneNumber})
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#888899', marginTop: '3px', display: 'block' }}>
                      Assigning a driver immediately sets pickup status to <strong>ASSIGNED</strong>.
                    </span>
                  </div>
                )}

                {/* Special Instructions */}
                <div className="form-group">
                  <label className="form-label">Special Instructions</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Ring apartment buzzer #4B, call before arriving"
                    value={form.specialInstruction}
                    onChange={e => setForm({ ...form, specialInstruction: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !form.orderId}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                >
                  {saving ? 'Scheduling...' : 'Schedule Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PICKUP DETAILS */}
      {modal === 'details' && selectedPickup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '1rem'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '620px', padding: '2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.4rem', fontWeight: 800 }}>
                    Pickup #{selectedPickup.id}
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    ...(STATUS_BADGE_STYLE[selectedPickup.pickupStatus] || STATUS_BADGE_STYLE.REQUESTED)
                  }}>
                    {selectedPickup.pickupStatus}
                  </span>
                </div>
                <p style={{ color: '#888899', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                  Created on {selectedPickup.createdAt ? new Date(selectedPickup.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button
                className="btn btn-icon"
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: '#888899', cursor: 'pointer', fontSize: '1.3rem' }}
              >
                ✕
              </button>
            </div>

            {/* WORKFLOW PIPELINE PROGRESS BAR */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>
                Pickup Lifecycle Progress
              </div>

              {selectedPickup.pickupStatus === 'CANCELLED' ? (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#F87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}>
                  <FiX size={18} /> This pickup request was CANCELLED.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  {/* Step 1: REQUESTED */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#3B82F6', color: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, boxShadow: '0 0 10px rgba(59,130,246,0.4)'
                    }}>
                      <FiClock size={16} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#60A5FA', fontWeight: 700, marginTop: '6px' }}>
                      REQUESTED
                    </span>
                  </div>

                  {/* Connector Line 1 */}
                  <div style={{
                    flex: 1,
                    height: '3px',
                    background: ['ASSIGNED', 'COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus)
                      ? 'linear-gradient(90deg, #3B82F6, #FF6B00)'
                      : 'rgba(255,255,255,0.1)',
                    margin: '0 8px',
                    marginBottom: '18px'
                  }} />

                  {/* Step 2: ASSIGNED */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: ['ASSIGNED', 'COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus)
                        ? '#FF6B00'
                        : 'rgba(255,255,255,0.1)',
                      color: ['ASSIGNED', 'COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus) ? '#FFFFFF' : '#64748B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                      boxShadow: selectedPickup.pickupStatus === 'ASSIGNED' ? '0 0 12px rgba(255,107,0,0.5)' : 'none'
                    }}>
                      <FiTruck size={16} />
                    </div>
                    <span style={{
                      fontSize: '0.78rem',
                      color: ['ASSIGNED', 'COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus) ? '#FF8C38' : '#64748B',
                      fontWeight: 700,
                      marginTop: '6px'
                    }}>
                      ASSIGNED
                    </span>
                  </div>

                  {/* Connector Line 2 */}
                  <div style={{
                    flex: 1,
                    height: '3px',
                    background: ['COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus)
                      ? 'linear-gradient(90deg, #FF6B00, #22C55E)'
                      : 'rgba(255,255,255,0.1)',
                    margin: '0 8px',
                    marginBottom: '18px'
                  }} />

                  {/* Step 3: COLLECTED */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: ['COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus)
                        ? '#22C55E'
                        : 'rgba(255,255,255,0.1)',
                      color: ['COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus) ? '#FFFFFF' : '#64748B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                      boxShadow: ['COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus) ? '0 0 12px rgba(34,197,94,0.5)' : 'none'
                    }}>
                      <FiCheck size={18} />
                    </div>
                    <span style={{
                      fontSize: '0.78rem',
                      color: ['COLLECTED', 'COMPLETED'].includes(selectedPickup.pickupStatus) ? '#4ADE80' : '#64748B',
                      fontWeight: 700,
                      marginTop: '6px'
                    }}>
                      COLLECTED
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Customer Box */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Customer Information
                </div>
                <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>
                  {selectedPickup.customerName || 'Customer'}
                </div>
                {selectedPickup.customerPhone && (
                  <div style={{ color: '#A0A0B0', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiPhone size={12} style={{ color: '#FF6B00' }} /> {selectedPickup.customerPhone}
                  </div>
                )}
                {selectedPickup.customerEmail && (
                  <div style={{ color: '#888899', fontSize: '0.8rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiMail size={12} /> {selectedPickup.customerEmail}
                  </div>
                )}
              </div>

              {/* Order Box */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Order Details
                </div>
                <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>
                  Order #{selectedPickup.orderId}
                </div>
                <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                  Rs. {(selectedPickup.orderTotalPrice || 0).toLocaleString()}
                </div>
                <div style={{ color: '#888899', fontSize: '0.8rem', marginTop: '2px' }}>
                  Status: <strong>{selectedPickup.orderStatus}</strong>
                </div>
              </div>

              {/* Schedule Box */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Pickup Schedule
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiCalendar style={{ color: '#60A5FA' }} /> {selectedPickup.pickupDate || 'N/A'}
                </div>
                <div style={{ color: '#A0A0B0', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiClock style={{ color: '#FBBF24' }} /> {selectedPickup.pickupTimeSlot}
                </div>
              </div>

              {/* Driver Box */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Assigned Driver
                </div>
                {selectedPickup.driverName ? (
                  <>
                    <div style={{ color: '#4ADE80', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiTruck size={14} /> {selectedPickup.driverName}
                    </div>
                    {selectedPickup.driverPhone && (
                      <div style={{ color: '#A0A0B0', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiPhone size={12} /> {selectedPickup.driverPhone}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#F59E0B', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>
                    No courier driver assigned yet.
                  </div>
                )}
              </div>
            </div>

            {/* Address & Instructions Full Width */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                Pickup Address
              </div>
              <div style={{ color: '#E0E0EE', fontSize: '0.9rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <FiMapPin size={16} style={{ color: '#FF6B00', marginTop: '2px', flexShrink: 0 }} />
                <span>{selectedPickup.pickupAddress}</span>
              </div>

              {selectedPickup.specialInstruction && (
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700 }}>
                    Special Instructions
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: '#D0D0E0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    "{selectedPickup.specialInstruction}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isStaff && selectedPickup.pickupStatus !== 'COLLECTED' && selectedPickup.pickupStatus !== 'CANCELLED' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => openAssignModal(selectedPickup)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiTruck /> {selectedPickup.driverId ? 'Reassign Driver' : 'Assign Driver'}
                </button>
              )}

              {isStaff && (selectedPickup.pickupStatus === 'ASSIGNED' || selectedPickup.pickupStatus === 'REQUESTED') && (
                <button
                  className="btn btn-primary"
                  onClick={() => openCollectModal(selectedPickup)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#22C55E', borderColor: '#22C55E' }}
                >
                  <FiCheck /> Mark as Collected
                </button>
              )}

              {selectedPickup.pickupStatus !== 'COLLECTED' && selectedPickup.pickupStatus !== 'CANCELLED' && (
                <button
                  className="btn btn-outline"
                  onClick={() => openCancelModal(selectedPickup)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  <FiX /> Cancel Pickup
                </button>
              )}

              <button className="btn btn-outline" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN DRIVER */}
      {modal === 'assign' && selectedPickup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200, padding: '1rem'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#FF6B00' }}><FiTruck /></span> Assign Courier Driver
              </h3>
              <button
                className="btn btn-icon"
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: '#888899', cursor: 'pointer', fontSize: '1.3rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '0.9rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ color: '#A0A0B0' }}>Pickup: <strong style={{ color: '#FFFFFF' }}>#PK-{selectedPickup.id}</strong> (Order #{selectedPickup.orderId})</div>
              <div style={{ color: '#A0A0B0', marginTop: '3px' }}>Customer: <strong style={{ color: '#FFFFFF' }}>{selectedPickup.customerName}</strong></div>
              <div style={{ color: '#888899', marginTop: '3px', fontSize: '0.8rem' }}>{selectedPickup.pickupAddress}</div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Select Delivery Driver *</label>
                <select
                  className="form-input"
                  required
                  value={assignDriverId}
                  onChange={e => setAssignDriverId(e.target.value)}
                >
                  <option value="">— Choose Driver —</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phoneNumber || 'Available'})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.78rem', color: '#A0A0B0', marginTop: '6px', display: 'block' }}>
                  Assigning a driver advances this pickup to <strong>ASSIGNED</strong>.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !assignDriverId}>
                  {saving ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MARK AS COLLECTED */}
      {modal === 'collect' && selectedPickup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200, padding: '1rem'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', padding: '10px', borderRadius: '50%' }}>
                <FiCheckCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
                  Mark as Collected?
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#888899' }}>
                  Pickup #{selectedPickup.id} • Order #{selectedPickup.orderId}
                </span>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}

            <p style={{ color: '#D0D0E0', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Confirm that the laundry has been physically collected from{' '}
              <strong style={{ color: '#FFFFFF' }}>{selectedPickup.customerName}</strong>.
              <br /><br />
              This will update the pickup status to <strong style={{ color: '#4ADE80' }}>COLLECTED</strong> and automatically transition Order #{selectedPickup.orderId} to <strong style={{ color: '#60A5FA' }}>RECEIVED</strong>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={handleCollectSubmit}
                style={{ background: '#22C55E', borderColor: '#22C55E', fontWeight: 700 }}
              >
                {saving ? 'Processing...' : 'Yes, Mark Collected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CANCEL PICKUP */}
      {modal === 'cancel' && selectedPickup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200, padding: '1rem'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', padding: '10px', borderRadius: '50%' }}>
                <FiX size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#EF4444', fontSize: '1.25rem', fontWeight: 700 }}>
                  Cancel Pickup Request?
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#888899' }}>
                  Pickup #{selectedPickup.id} • Order #{selectedPickup.orderId}
                </span>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}

            <p style={{ color: '#D0D0E0', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to cancel this doorstep collection request?
              <br /><br />
              Current status: <span style={{
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                ...(STATUS_BADGE_STYLE[selectedPickup.pickupStatus] || STATUS_BADGE_STYLE.REQUESTED)
              }}>
                {selectedPickup.pickupStatus}
              </span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={closeModal}>Keep Pickup</button>
              <button
                className="btn btn-danger"
                disabled={saving}
                onClick={handleCancelSubmit}
                style={{ fontWeight: 700 }}
              >
                {saving ? 'Cancelling...' : 'Yes, Cancel Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
