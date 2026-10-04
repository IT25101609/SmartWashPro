import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiPackage, FiPlus, FiRefreshCw, FiCheck, FiX, FiClock,
  FiCalendar, FiMapPin, FiUser, FiPhone, FiMail, FiSearch,
  FiEye, FiAlertCircle, FiTruck, FiCheckCircle, FiArrowRight,
  FiSend, FiRotateCcw
} from 'react-icons/fi';

const STATUS_BADGE_STYLE = {
  PENDING: { background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' },
  ASSIGNED: { background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' },
  OUT_FOR_DELIVERY: { background: 'rgba(255, 107, 0, 0.18)', color: '#FF8C38', border: '1px solid rgba(255, 107, 0, 0.4)' },
  DELIVERED: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.3)' },
  FAILED: { background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' },
  CANCELLED: { background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.3)' }
};

const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00'
];

export default function DeliveriesPage() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const isStaff = ['ADMIN', 'BRANCH_MANAGER_ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST'].includes(user?.role);

  // Data states
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals: null | 'create' | 'details' | 'assign' | 'dispatch' | 'deliver' | 'fail'
  const [modal, setModal] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Create form state
  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    deliveryAddress: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    estimatedTime: TIME_SLOTS[2],
    driverId: '',
    specialInstruction: ''
  });

  // Assign Driver modal state
  const [assignDriverId, setAssignDriverId] = useState('');

  // Fail Delivery reason
  const [failReason, setFailReason] = useState('Customer unavailable at delivery address');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 1. Load Deliveries
  const loadDeliveries = () => {
    setLoading(true);
    const endpoint = isCustomer ? '/deliveries/my' : '/deliveries';
    const params = { size: 100 };
    if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    if (search.trim()) params.search = search.trim();

    api.get(endpoint, { params })
      .then(res => {
        setDeliveries(res.data?.content || []);
      })
      .catch(err => {
        console.error('Failed to load deliveries:', err);
        toast.error('Failed to load deliveries');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeliveries();
  }, [user, statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDeliveries();
  };

  // 2. Load supporting data
  const loadSupportingData = async () => {
    try {
      if (isStaff) {
        api.get('/deliveries/drivers').then(r => setDrivers(r.data || [])).catch(() => {});
        api.get('/customers', { params: { size: 100 } }).then(r => setCustomers(r.data?.content || [])).catch(() => {});
      }
      api.get('/deliveries/eligible-orders').then(r => setEligibleOrders(r.data || [])).catch(() => {});
    } catch (err) {
      console.error('Error fetching supporting data:', err);
    }
  };

  useEffect(() => {
    loadSupportingData();
  }, [user, isStaff]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.deliveryStatus === 'PENDING').length;
    const assigned = deliveries.filter(d => d.deliveryStatus === 'ASSIGNED').length;
    const out = deliveries.filter(d => d.deliveryStatus === 'OUT_FOR_DELIVERY').length;
    const delivered = deliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;
    const failed = deliveries.filter(d => d.deliveryStatus === 'FAILED').length;
    return { total, pending, assigned, out, delivered, failed };
  }, [deliveries]);

  // Modal Open Handlers
  const openCreateModal = () => {
    loadSupportingData();
    const defaultAddress = user?.address || '';
    setForm({
      customerId: '',
      orderId: '',
      deliveryAddress: defaultAddress,
      deliveryDate: new Date().toISOString().split('T')[0],
      estimatedTime: TIME_SLOTS[2],
      driverId: '',
      specialInstruction: ''
    });
    setError('');
    setModal('create');
  };

  const openDetailsModal = (delivery) => {
    setSelectedDelivery(delivery);
    setError('');
    setModal('details');
  };

  const openAssignModal = (delivery) => {
    setSelectedDelivery(delivery);
    setAssignDriverId(delivery.driverId ? String(delivery.driverId) : '');
    setError('');
    setModal('assign');
  };

  const openDispatchModal = (delivery) => {
    setSelectedDelivery(delivery);
    setError('');
    setModal('dispatch');
  };

  const openDeliverModal = (delivery) => {
    setSelectedDelivery(delivery);
    setError('');
    setModal('deliver');
  };

  const openFailModal = (delivery) => {
    setSelectedDelivery(delivery);
    setFailReason('Customer unavailable at delivery address');
    setError('');
    setModal('fail');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedDelivery(null);
    setError('');
    setSaving(false);
  };

  // Customer dropdown change in Create Form
  const handleCustomerChange = (customerId) => {
    const cid = customerId ? parseInt(customerId) : '';
    const selectedCust = customers.find(c => c.id === cid);
    const newAddress = selectedCust?.address || form.deliveryAddress;
    setForm(prev => ({
      ...prev,
      customerId: cid,
      orderId: '',
      deliveryAddress: newAddress
    }));
  };

  // Order dropdown change in Create Form
  const handleOrderChange = (orderId) => {
    const oid = orderId ? parseInt(orderId) : '';
    const selectedOrd = eligibleOrders.find(o => o.id === oid);
    setForm(prev => ({
      ...prev,
      orderId: oid,
      customerId: selectedOrd?.customerId || prev.customerId,
      deliveryAddress: selectedOrd?.customerAddress || prev.deliveryAddress || ''
    }));
  };

  const availableOrdersForForm = useMemo(() => {
    if (form.customerId) {
      return eligibleOrders.filter(o => o.customerId === form.customerId);
    }
    return eligibleOrders;
  }, [eligibleOrders, form.customerId]);

  // Action: Create Delivery Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId) {
      setError('Please select an active order for this delivery.');
      return;
    }
    if (!form.deliveryAddress?.trim()) {
      setError('Delivery address is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        orderId: parseInt(form.orderId),
        customerId: form.customerId ? parseInt(form.customerId) : undefined,
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryDate: form.deliveryDate,
        estimatedTime: form.estimatedTime,
        driverId: form.driverId ? parseInt(form.driverId) : undefined,
        specialInstruction: form.specialInstruction?.trim() || null
      };

      await api.post('/deliveries', payload);
      toast.success('Delivery scheduled successfully!');
      closeModal();
      loadDeliveries();
      loadSupportingData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create delivery schedule');
    } finally {
      setSaving(false);
    }
  };

  // Action: Assign Driver Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignDriverId) {
      setError('Please select a delivery driver.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/deliveries/${selectedDelivery.id}/assign`, {
        driverId: parseInt(assignDriverId)
      });
      toast.success('Driver assigned successfully! Status set to ASSIGNED.');
      closeModal();
      loadDeliveries();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to assign driver');
    } finally {
      setSaving(false);
    }
  };

  // Action: Dispatch (Out for Delivery) Submit
  const handleDispatchSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/deliveries/${selectedDelivery.id}/status`, {
        status: 'OUT_FOR_DELIVERY'
      });
      toast.success('Delivery is OUT FOR DELIVERY! Order status synchronized.');
      closeModal();
      loadDeliveries();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to dispatch delivery');
    } finally {
      setSaving(false);
    }
  };

  // Action: Mark as Delivered Submit
  const handleDeliverSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/deliveries/${selectedDelivery.id}/deliver`);
      toast.success('Order marked as DELIVERED! Handover confirmed.');
      closeModal();
      loadDeliveries();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to mark as delivered');
    } finally {
      setSaving(false);
    }
  };

  // Action: Mark as Failed Submit
  const handleFailSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/deliveries/${selectedDelivery.id}/fail`, {
        reason: failReason.trim()
      });
      toast.success('Delivery marked as FAILED. Order returned to branch.');
      closeModal();
      loadDeliveries();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to record failed delivery');
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
              <FiPackage size={24} />
            </span>
            {isCustomer ? 'My Laundry Deliveries' : 'Delivery & Dispatch Management'}
          </h1>
          <p style={{ color: '#A0A0B0', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            {isCustomer
              ? 'Track finished laundry packages arriving at your doorstep.'
              : 'Dispatch workflow: PENDING → ASSIGNED → OUT_FOR_DELIVERY → DELIVERED'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => { loadDeliveries(); loadSupportingData(); }}
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
            <FiPlus size={18} /> Schedule Delivery
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Deliveries */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #FF6B00',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Deliveries</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{stats.total}</div>
          </div>
          <div style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', padding: '12px', borderRadius: '10px' }}>
            <FiPackage size={22} />
          </div>
        </div>

        {/* Pending */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #3B82F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>{stats.pending}</div>
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
            <div style={{ color: '#888899', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Driver</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>{stats.assigned}</div>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: '#FBBF24', padding: '12px', borderRadius: '10px' }}>
            <FiTruck size={22} />
          </div>
        </div>

        {/* Out For Delivery */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #FF8C38',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Out For Delivery</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FF8C38', marginTop: '4px' }}>{stats.out}</div>
          </div>
          <div style={{ background: 'rgba(255,107,0,0.1)', color: '#FF8C38', padding: '12px', borderRadius: '10px' }}>
            <FiSend size={22} />
          </div>
        </div>

        {/* Delivered */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #22C55E',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Delivered</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ADE80', marginTop: '4px' }}>{stats.delivered}</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', padding: '12px', borderRadius: '10px' }}>
            <FiCheckCircle size={22} />
          </div>
        </div>

        {/* Failed */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          borderLeft: '4px solid #EF4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#888899', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Failed</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F87171', marginTop: '4px' }}>{stats.failed}</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', padding: '12px', borderRadius: '10px' }}>
            <FiAlertCircle size={22} />
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
            {['ALL', 'PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'].map(st => (
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
                {st === 'ALL' ? 'All Deliveries' : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Search & Date Filter */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '150px' }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                title="Filter by Delivery Date"
              />
              {dateFilter && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDateFilter('')}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#EF4444' }}
                >
                  Clear
                </button>
              )}
            </div>

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

      {/* DELIVERIES TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#A0A0B0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }}>⏳</div>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading deliveries...</p>
        </div>
      ) : (
        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 90 }}>Delivery ID</th>
                  <th style={{ minWidth: 140 }}>Order</th>
                  {!isCustomer && <th style={{ minWidth: 180 }}>Customer</th>}
                  <th style={{ minWidth: 220 }}>Delivery Address</th>
                  <th style={{ minWidth: 160 }}>Scheduled Slot</th>
                  <th style={{ minWidth: 180 }}>Courier / Driver</th>
                  <th style={{ minWidth: 140 }}>Status</th>
                  <th style={{ textAlign: 'right', minWidth: 250 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => {
                  const isPending = d.deliveryStatus === 'PENDING';
                  const isAssigned = d.deliveryStatus === 'ASSIGNED';
                  const isOut = d.deliveryStatus === 'OUT_FOR_DELIVERY';
                  const isDelivered = d.deliveryStatus === 'DELIVERED';
                  const isFailed = d.deliveryStatus === 'FAILED';

                  return (
                    <tr key={d.id} style={{ background: 'rgba(255,255,255,0.015)' }}>
                      {/* ID */}
                      <td style={{ fontWeight: 700, color: '#FF6B00' }}>
                        #DL-{d.id}
                      </td>

                      {/* Order info */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.9rem' }}>
                            Order #{d.orderId}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#A0A0B0', marginTop: '2px' }}>
                            Rs. {(d.orderTotalPrice || 0).toLocaleString()} • {d.orderStatus}
                          </span>
                        </div>
                      </td>

                      {/* Customer info */}
                      {!isCustomer && (
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{d.customerName || 'Customer'}</span>
                            {d.customerPhone && (
                              <span style={{ fontSize: '0.8rem', color: '#888899', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <FiPhone size={11} /> {d.customerPhone}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Delivery Address */}
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
                          }} title={d.deliveryAddress}>
                            {d.deliveryAddress || 'No address specified'}
                          </span>
                        </div>
                      </td>

                      {/* Date & Time Slot */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FiCalendar size={12} style={{ color: '#60A5FA' }} /> {d.deliveryDate || 'Date pending'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#888899', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FiClock size={12} /> {d.estimatedTime || '14:00 - 16:00'}
                          </span>
                        </div>
                      </td>

                      {/* Driver */}
                      <td>
                        {d.driverName ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4ADE80', fontWeight: 600, fontSize: '0.85rem' }}>
                              <FiTruck size={13} /> {d.driverName}
                            </span>
                            {d.driverPhone && (
                              <span style={{ fontSize: '0.75rem', color: '#888899', marginTop: '2px' }}>
                                {d.driverPhone}
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
                            ...(STATUS_BADGE_STYLE[d.deliveryStatus] || STATUS_BADGE_STYLE.PENDING)
                          }}
                        >
                          {d.deliveryStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {/* View Details */}
                          <button
                            className="btn btn-outline"
                            onClick={() => openDetailsModal(d)}
                            style={{ padding: '5px 9px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="View Delivery Details"
                          >
                            <FiEye size={12} /> Details
                          </button>

                          {/* Assign Driver (Staff only, when not delivered) */}
                          {isStaff && !isDelivered && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => openAssignModal(d)}
                              style={{ padding: '5px 9px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Assign Driver"
                            >
                              <FiTruck size={12} /> {d.driverId ? 'Reassign' : 'Assign'}
                            </button>
                          )}

                          {/* Dispatch (Out for Delivery) - When Assigned or Pending */}
                          {isStaff && (isAssigned || isPending) && (
                            <button
                              className="btn btn-outline"
                              onClick={() => openDispatchModal(d)}
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#FF8C38',
                                borderColor: 'rgba(255,107,0,0.4)'
                              }}
                              title="Dispatch: Out For Delivery"
                            >
                              <FiSend size={12} /> Dispatch
                            </button>
                          )}

                          {/* Mark Delivered - When Out For Delivery or Assigned */}
                          {isStaff && (isOut || isAssigned) && (
                            <button
                              className="btn btn-primary"
                              onClick={() => openDeliverModal(d)}
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#22C55E',
                                borderColor: '#22C55E'
                              }}
                              title="Mark Delivered"
                            >
                              <FiCheck size={12} /> Deliver
                            </button>
                          )}

                          {/* Mark Failed - When Out For Delivery or Assigned */}
                          {isStaff && (isOut || isAssigned) && (
                            <button
                              className="btn btn-outline"
                              onClick={() => openFailModal(d)}
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.78rem',
                                color: '#EF4444',
                                borderColor: 'rgba(239,68,68,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Mark Delivery as Failed"
                            >
                              <FiX size={12} /> Fail
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!deliveries.length && (
                  <tr>
                    <td colSpan={isCustomer ? 7 : 8} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#64748B' }}>📦</div>
                      <h3 style={{ color: '#FFFFFF', margin: '0 0 0.5rem 0', fontWeight: 700 }}>No Deliveries Found</h3>
                      <p style={{ color: '#888899', fontSize: '0.9rem', margin: '0 0 1.5rem 0', maxWidth: '400px', marginInline: 'auto' }}>
                        {isCustomer
                          ? 'You currently have no scheduled deliveries matching your search filters.'
                          : 'No delivery dispatches match your search or filter criteria.'}
                      </p>
                      <button onClick={openCreateModal} className="btn btn-primary" style={{ fontWeight: 600 }}>
                        <FiPlus /> Schedule New Delivery
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / SCHEDULE DELIVERY */}
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
                <span style={{ color: '#FF6B00' }}><FiPackage /></span> Schedule Doorstep Delivery
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
                    <FiPackage size={13} style={{ color: '#FF6B00' }} /> Select Order to Deliver *
                  </label>
                  <select
                    className="form-input"
                    required
                    value={form.orderId}
                    onChange={e => handleOrderChange(e.target.value)}
                  >
                    <option value="">— Select active order to dispatch —</option>
                    {availableOrdersForForm.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} — Rs. {(o.totalPrice || 0).toLocaleString()} ({o.orderStatus}) • {o.customerName}
                      </option>
                    ))}
                  </select>
                  {availableOrdersForForm.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '4px', display: 'block' }}>
                      ℹ️ No active unassigned orders found ready for delivery dispatch.
                    </span>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiMapPin size={13} style={{ color: '#FF6B00' }} /> Destination Delivery Address *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Enter full recipient street address"
                    value={form.deliveryAddress}
                    onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                  />
                </div>

                {/* Date & Time Slot in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiCalendar size={13} style={{ color: '#FF6B00' }} /> Delivery Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={form.deliveryDate}
                      onChange={e => setForm({ ...form, deliveryDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiClock size={13} style={{ color: '#FF6B00' }} /> Time Window *
                    </label>
                    <select
                      className="form-input"
                      value={form.estimatedTime}
                      onChange={e => setForm({ ...form, estimatedTime: e.target.value })}
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
                      <option value="">— Unassigned (Will set status to PENDING) —</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.phoneNumber})
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#888899', marginTop: '3px', display: 'block' }}>
                      Assigning a driver immediately sets delivery status to <strong>ASSIGNED</strong>.
                    </span>
                  </div>
                )}

                {/* Special Instructions */}
                <div className="form-group">
                  <label className="form-label">Drop-off Instructions</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Leave with security guard, call upon arrival"
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
                  {saving ? 'Scheduling...' : 'Schedule Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW DELIVERY DETAILS */}
      {modal === 'details' && selectedDelivery && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '1rem'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '640px', padding: '2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.4rem', fontWeight: 800 }}>
                    Delivery #{selectedDelivery.id}
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    ...(STATUS_BADGE_STYLE[selectedDelivery.deliveryStatus] || STATUS_BADGE_STYLE.PENDING)
                  }}>
                    {selectedDelivery.deliveryStatus?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p style={{ color: '#888899', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                  Created on {selectedDelivery.createdAt ? new Date(selectedDelivery.createdAt).toLocaleString() : 'N/A'}
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

            {/* 4-STAGE WORKFLOW PIPELINE PROGRESS BAR */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>
                Delivery Workflow Progress
              </div>

              {selectedDelivery.deliveryStatus === 'FAILED' ? (
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
                  <FiAlertCircle size={18} /> Delivery attempt FAILED. Items returned to branch facility for rescheduling.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  {/* Step 1: PENDING */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: '#3B82F6', color: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, boxShadow: '0 0 10px rgba(59,130,246,0.4)'
                    }}>
                      <FiClock size={15} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700, marginTop: '6px' }}>
                      PENDING
                    </span>
                  </div>

                  {/* Line 1 */}
                  <div style={{
                    flex: 1, height: '3px',
                    background: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus)
                      ? 'linear-gradient(90deg, #3B82F6, #F59E0B)'
                      : 'rgba(255,255,255,0.1)',
                    margin: '0 6px', marginBottom: '16px'
                  }} />

                  {/* Step 2: ASSIGNED */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus)
                        ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                      color: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus) ? '#FFFFFF' : '#64748B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                      boxShadow: selectedDelivery.deliveryStatus === 'ASSIGNED' ? '0 0 10px rgba(245,158,11,0.5)' : 'none'
                    }}>
                      <FiTruck size={15} />
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus) ? '#FBBF24' : '#64748B',
                      fontWeight: 700, marginTop: '6px'
                    }}>
                      ASSIGNED
                    </span>
                  </div>

                  {/* Line 2 */}
                  <div style={{
                    flex: 1, height: '3px',
                    background: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus)
                      ? 'linear-gradient(90deg, #F59E0B, #FF8C38)'
                      : 'rgba(255,255,255,0.1)',
                    margin: '0 6px', marginBottom: '16px'
                  }} />

                  {/* Step 3: OUT_FOR_DELIVERY */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus)
                        ? '#FF6B00' : 'rgba(255,255,255,0.1)',
                      color: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus) ? '#FFFFFF' : '#64748B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                      boxShadow: selectedDelivery.deliveryStatus === 'OUT_FOR_DELIVERY' ? '0 0 12px rgba(255,107,0,0.6)' : 'none'
                    }}>
                      <FiSend size={15} />
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDelivery.deliveryStatus) ? '#FF8C38' : '#64748B',
                      fontWeight: 700, marginTop: '6px'
                    }}>
                      DISPATCHED
                    </span>
                  </div>

                  {/* Line 3 */}
                  <div style={{
                    flex: 1, height: '3px',
                    background: selectedDelivery.deliveryStatus === 'DELIVERED'
                      ? 'linear-gradient(90deg, #FF8C38, #22C55E)'
                      : 'rgba(255,255,255,0.1)',
                    margin: '0 6px', marginBottom: '16px'
                  }} />

                  {/* Step 4: DELIVERED */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: selectedDelivery.deliveryStatus === 'DELIVERED'
                        ? '#22C55E' : 'rgba(255,255,255,0.1)',
                      color: selectedDelivery.deliveryStatus === 'DELIVERED' ? '#FFFFFF' : '#64748B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                      boxShadow: selectedDelivery.deliveryStatus === 'DELIVERED' ? '0 0 12px rgba(34,197,94,0.6)' : 'none'
                    }}>
                      <FiCheck size={17} />
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: selectedDelivery.deliveryStatus === 'DELIVERED' ? '#4ADE80' : '#64748B',
                      fontWeight: 700, marginTop: '6px'
                    }}>
                      DELIVERED
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
                  {selectedDelivery.customerName || 'Customer'}
                </div>
                {selectedDelivery.customerPhone && (
                  <div style={{ color: '#A0A0B0', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiPhone size={12} style={{ color: '#FF6B00' }} /> {selectedDelivery.customerPhone}
                  </div>
                )}
                {selectedDelivery.customerEmail && (
                  <div style={{ color: '#888899', fontSize: '0.8rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiMail size={12} /> {selectedDelivery.customerEmail}
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
                  Order Summary
                </div>
                <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>
                  Order #{selectedDelivery.orderId}
                </div>
                <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                  Rs. {(selectedDelivery.orderTotalPrice || 0).toLocaleString()}
                </div>
                <div style={{ color: '#888899', fontSize: '0.8rem', marginTop: '2px' }}>
                  Status: <strong>{selectedDelivery.orderStatus}</strong>
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
                  Delivery Window
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiCalendar style={{ color: '#60A5FA' }} /> {selectedDelivery.deliveryDate || 'N/A'}
                </div>
                <div style={{ color: '#A0A0B0', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiClock style={{ color: '#FBBF24' }} /> {selectedDelivery.estimatedTime || '14:00 - 16:00'}
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
                  Assigned Courier Driver
                </div>
                {selectedDelivery.driverName ? (
                  <>
                    <div style={{ color: '#4ADE80', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiTruck size={14} /> {selectedDelivery.driverName}
                    </div>
                    {selectedDelivery.driverPhone && (
                      <div style={{ color: '#A0A0B0', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiPhone size={12} /> {selectedDelivery.driverPhone}
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

            {/* Delivery Address Full Width */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#888899', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                Delivery Destination
              </div>
              <div style={{ color: '#E0E0EE', fontSize: '0.9rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <FiMapPin size={16} style={{ color: '#FF6B00', marginTop: '2px', flexShrink: 0 }} />
                <span>{selectedDelivery.deliveryAddress}</span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isStaff && selectedDelivery.deliveryStatus !== 'DELIVERED' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => openAssignModal(selectedDelivery)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiTruck /> {selectedDelivery.driverId ? 'Reassign Driver' : 'Assign Driver'}
                </button>
              )}

              {isStaff && (selectedDelivery.deliveryStatus === 'ASSIGNED' || selectedDelivery.deliveryStatus === 'PENDING') && (
                <button
                  className="btn btn-outline"
                  onClick={() => openDispatchModal(selectedDelivery)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF8C38', borderColor: 'rgba(255,107,0,0.4)' }}
                >
                  <FiSend /> Out For Delivery
                </button>
              )}

              {isStaff && (selectedDelivery.deliveryStatus === 'OUT_FOR_DELIVERY' || selectedDelivery.deliveryStatus === 'ASSIGNED') && (
                <button
                  className="btn btn-primary"
                  onClick={() => openDeliverModal(selectedDelivery)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#22C55E', borderColor: '#22C55E' }}
                >
                  <FiCheck /> Mark Delivered
                </button>
              )}

              {isStaff && (selectedDelivery.deliveryStatus === 'OUT_FOR_DELIVERY' || selectedDelivery.deliveryStatus === 'ASSIGNED') && (
                <button
                  className="btn btn-outline"
                  onClick={() => openFailModal(selectedDelivery)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  <FiX /> Mark as Failed
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
      {modal === 'assign' && selectedDelivery && (
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
              <button className="btn btn-icon" onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#888899', cursor: 'pointer', fontSize: '1.3rem' }}>
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
              <div style={{ color: '#A0A0B0' }}>Delivery: <strong style={{ color: '#FFFFFF' }}>#DL-{selectedDelivery.id}</strong> (Order #{selectedDelivery.orderId})</div>
              <div style={{ color: '#A0A0B0', marginTop: '3px' }}>Customer: <strong style={{ color: '#FFFFFF' }}>{selectedDelivery.customerName}</strong></div>
              <div style={{ color: '#888899', marginTop: '3px', fontSize: '0.8rem' }}>{selectedDelivery.deliveryAddress}</div>
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
                  Assigning a driver updates delivery status to <strong>ASSIGNED</strong>.
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

      {/* MODAL 4: DISPATCH (OUT FOR DELIVERY) */}
      {modal === 'dispatch' && selectedDelivery && (
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
              <div style={{ background: 'rgba(255,107,0,0.15)', color: '#FF8C38', padding: '10px', borderRadius: '50%' }}>
                <FiSend size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
                  Dispatch for Delivery?
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#888899' }}>
                  Delivery #{selectedDelivery.id} • Order #{selectedDelivery.orderId}
                </span>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}

            <p style={{ color: '#D0D0E0', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Confirm that this package has departed with the courier and is now on the way to{' '}
              <strong style={{ color: '#FFFFFF' }}>{selectedDelivery.customerName}</strong>.
              <br /><br />
              This will advance status to <strong style={{ color: '#FF8C38' }}>OUT FOR DELIVERY</strong> and synchronize Order #{selectedDelivery.orderId}.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={handleDispatchSubmit}
                style={{ fontWeight: 700 }}
              >
                {saving ? 'Dispatching...' : 'Yes, Dispatch Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: MARK DELIVERED */}
      {modal === 'deliver' && selectedDelivery && (
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
                  Confirm Delivery Handover?
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#888899' }}>
                  Delivery #{selectedDelivery.id} • Order #{selectedDelivery.orderId}
                </span>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}

            <p style={{ color: '#D0D0E0', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Confirm that the package has been successfully delivered and handed over to{' '}
              <strong style={{ color: '#FFFFFF' }}>{selectedDelivery.customerName}</strong>.
              <br /><br />
              This will complete the lifecycle by updating Delivery status to <strong style={{ color: '#4ADE80' }}>DELIVERED</strong> and Order #{selectedDelivery.orderId} to <strong style={{ color: '#4ADE80' }}>DELIVERED</strong>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={handleDeliverSubmit}
                style={{ background: '#22C55E', borderColor: '#22C55E', fontWeight: 700 }}
              >
                {saving ? 'Processing...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: MARK FAILED */}
      {modal === 'fail' && selectedDelivery && (
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
                <FiAlertCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#EF4444', fontSize: '1.25rem', fontWeight: 700 }}>
                  Mark Delivery as Failed
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#888899' }}>
                  Delivery #{selectedDelivery.id} • Order #{selectedDelivery.orderId}
                </span>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}

            <p style={{ color: '#D0D0E0', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              When a delivery cannot be completed, status is set to <strong style={{ color: '#F87171' }}>FAILED</strong> and the package is brought back to the branch (Order status reverts to <strong style={{ color: '#60A5FA' }}>READY</strong>).
            </p>

            <form onSubmit={handleFailSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Failure Reason *</label>
                <select
                  className="form-input"
                  required
                  value={failReason}
                  onChange={e => setFailReason(e.target.value)}
                >
                  <option value="Customer unavailable at delivery address">Customer unavailable at delivery address</option>
                  <option value="Incorrect address or inaccessible location">Incorrect address or inaccessible location</option>
                  <option value="Customer requested rescheduling">Customer requested rescheduling</option>
                  <option value="Weather / road blockage delay">Weather / road blockage delay</option>
                  <option value="Recipient refused delivery">Recipient refused delivery</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={saving}
                  style={{ fontWeight: 700 }}
                >
                  {saving ? 'Recording...' : 'Mark as Failed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
