import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCreditCard, FiDollarSign, FiClock, FiCheckCircle, 
  FiFileText, FiPrinter, FiSearch, FiRefreshCw, FiPlus, 
  FiCheck, FiX, FiAlertTriangle, FiAlertCircle, FiArrowRight, FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const METHOD_CONFIG = {
  CASH: { label: 'Cash at Counter', icon: '💵', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  CARD: { label: 'Credit / Debit Card', icon: '💳', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' },
  ONLINE_PAYMENT: { label: 'Online Payment', icon: '🌐', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
  DIGITAL_PAYMENT: { label: 'Online Payment', icon: '🌐', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
  CASH_ON_DELIVERY: { label: 'Cash on Delivery', icon: '🚚', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
};

const STATUS_BADGE = {
  PAID: { label: 'PAID', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
  PENDING: { label: 'PENDING', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  REFUNDED: { label: 'REFUNDED', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
  FAILED: { label: 'FAILED', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [unpaidOrders, setUnpaidOrders] = useState([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const isCustomer = user?.role === 'CUSTOMER';
  const isAdmin = user?.role === 'ADMIN';
  const isManager = ['ADMIN', 'BRANCH_MANAGER_ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST'].includes(user?.role);

  const initialBranchFilter = isAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL');
  const [branchFilter, setBranchFilter] = useState(initialBranchFilter);

  // Sync branchFilter for non-admins
  useEffect(() => {
    if (!isAdmin && user?.branchId) {
      setBranchFilter(String(user.branchId));
    }
  }, [isAdmin, user]);

  const loadData = () => {
    setLoading(true);
    const params = { size: 100 };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (methodFilter !== 'ALL') params.method = methodFilter;
    const effBranch = isAdmin ? (branchFilter !== 'ALL' ? branchFilter : undefined) : (user?.branchId || (branchFilter !== 'ALL' ? branchFilter : undefined));
    if (effBranch) params.branchId = effBranch;
    if (search.trim()) params.search = search.trim();

    const endpoint = isCustomer ? '/payments/my' : '/payments';
    api.get(endpoint, { params })
      .then(r => setPayments(r.data.content || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, methodFilter, branchFilter]);

  // Load unpaid orders & branches on mount
  useEffect(() => {
    api.get('/payments/unpaid-orders')
      .then(r => setUnpaidOrders(r.data || []))
      .catch(() => {});

    api.get('/branches')
      .then(r => setBranches(r.data || []))
      .catch(() => {});
  }, []);

  const openRecordModal = (preselectedOrder = null) => {
    // Refresh unpaid orders
    api.get('/payments/unpaid-orders').then(r => setUnpaidOrders(r.data || [])).catch(() => {});

    if (preselectedOrder) {
      setRecordForm({
        orderId: preselectedOrder.orderId,
        amount: preselectedOrder.totalPrice,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        transactionReference: `TXN-POS-${Date.now().toString().slice(-6)}`
      });
      setSelectedOrderInfo(preselectedOrder);
    } else {
      setRecordForm({
        orderId: '',
        amount: '',
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        transactionReference: `TXN-POS-${Date.now().toString().slice(-6)}`
      });
      setSelectedOrderInfo(null);
    }
    setRecordError('');
    setModal('record');
  };

  const handleOrderSelect = (orderIdStr) => {
    const oId = Number(orderIdStr);
    const found = unpaidOrders.find(o => o.orderId === oId);
    setSelectedOrderInfo(found || null);
    setRecordForm(prev => ({
      ...prev,
      orderId: oId,
      amount: found ? found.totalPrice : ''
    }));
    setRecordError('');
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.orderId) {
      setRecordError('Please select an active order to pay.');
      return;
    }

    const amt = Number(recordForm.amount);
    if (!amt || amt <= 0) {
      setRecordError('Payment amount must be greater than zero.');
      return;
    }

    if (selectedOrderInfo && amt > selectedOrderInfo.totalPrice) {
      setRecordError(`Payment amount (Rs. ${amt.toLocaleString()}) cannot exceed the order total of Rs. ${selectedOrderInfo.totalPrice.toLocaleString()}.`);
      return;
    }

    setSaving(true);
    setRecordError('');
    try {
      const payload = {
        orderId: recordForm.orderId,
        amount: amt,
        paymentMethod: recordForm.paymentMethod,
        paymentStatus: recordForm.paymentStatus,
        transactionReference: recordForm.transactionReference || `TXN-${Date.now().toString().slice(-6)}`
      };
      const res = await api.post('/payments', payload);
      toast.success(`Payment recorded successfully! Receipt: ${res.data.receiptNumber}`);
      setModal(null);
      loadData();
      // refresh unpaid list
      api.get('/payments/unpaid-orders').then(r => setUnpaidOrders(r.data || [])).catch(() => {});
    } catch (err) {
      setRecordError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (p) => {
    setSelectedPayment(p);
    setStatusForm({
      status: p.paymentStatus,
      transactionReference: p.transactionReference || ''
    });
    setModal('status');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/payments/${selectedPayment.id}/status`, statusForm);
      toast.success(`Payment status updated to ${statusForm.status}`);
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickMarkPaid = async (p) => {
    try {
      await api.put(`/payments/${p.id}/status`, {
        status: 'PAID',
        transactionReference: p.transactionReference || `TXN-COUNTER-${Date.now().toString().slice(-6)}`
      });
      toast.success(`Order #${p.orderId} marked as PAID. Receipt ${p.receiptNumber}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark payment as paid');
    }
  };

  const openInvoiceModal = async (payment) => {
    setSelectedPayment(payment);
    setInvoiceLoading(true);
    setModal('invoice');
    try {
      if (payment.orderId) {
        const res = await api.get(`/orders/${payment.orderId}`);
        setInvoiceOrder(res.data);
      } else {
        setInvoiceOrder(null);
      }
    } catch (e) {
      console.error(e);
      setInvoiceOrder(null);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Filtered Payments for Client-Side Search
  const displayPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(p => 
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
      (p.orderId && p.orderId.toString().includes(q)) ||
      (p.customerName && p.customerName.toLowerCase().includes(q)) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(q)) ||
      (p.branchName && p.branchName.toLowerCase().includes(q))
    );
  }, [payments, search]);

  // Overall Financial Metrics
  const stats = useMemo(() => {
    let settled = 0;
    let pending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    payments.forEach(p => {
      if (p.paymentStatus === 'PAID') {
        settled += (p.amount || 0);
        paidCount++;
      } else if (p.paymentStatus === 'PENDING') {
        pending += (p.amount || 0);
        pendingCount++;
      }
    });

    const rate = payments.length > 0 ? Math.round((paidCount / payments.length) * 100) : 100;
    return { settled, pending, paidCount, pendingCount, total: payments.length, rate };
  }, [payments]);

  return (
    <div style={{ padding: '0 0.5rem 2.5rem 0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FiCreditCard style={{ color: '#FF6B00' }} /> {isCustomer ? 'My Payments & Invoices' : 'Payment Management'}
          </h1>
          <p style={{ color: '#A0A0B0', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {isCustomer ? 'View verified payment receipts, download invoices, and settle outstanding balances.' : 'Record payments, issue verified receipts, and monitor financial transactions.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiRefreshCw /> Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => openRecordModal()} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            <FiPlus size={18} /> Record Payment
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.2rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Settled */}
        <div className="card-glass" style={{ padding: '1.3rem', borderLeft: '4px solid #22C55E' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Total Settled</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
              <FiCheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF' }}>
            Rs. {stats.settled.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#22C55E', marginTop: '0.25rem' }}>
            {stats.paidCount} paid transaction{stats.paidCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Outstanding / Pending */}
        <div className="card-glass" style={{ padding: '1.3rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Outstanding Due</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <FiClock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FACC15' }}>
            Rs. {stats.pending.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
            {stats.pendingCount} pending balance{stats.pendingCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Total Invoices */}
        <div className="card-glass" style={{ padding: '1.3rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Invoices & Receipts</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <FiFileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
            Official electronic tax receipts
          </div>
        </div>

        {/* Settlement Rate */}
        <div className="card-glass" style={{ padding: '1.3rem', borderLeft: '4px solid #A855F7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Settlement Rate</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
              <FiDollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#A855F7' }}>
            {stats.rate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
            Collection efficiency
          </div>
        </div>
      </div>

      {/* Unpaid Orders Quick Pay Banner (if any exist) */}
      {unpaidOrders.length > 0 && (
        <div className="card-glass" style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          backgroundColor: 'rgba(255, 107, 0, 0.08)',
          border: '1px solid rgba(255, 107, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#FF6B00', color: '#FFFFFF' }}>
              <FiAlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem' }}>
                {unpaidOrders.length} Order{unpaidOrders.length > 1 ? 's' : ''} Awaiting Payment Settlement
              </div>
              <div style={{ color: '#E2E8F0', fontSize: '0.85rem' }}>
                Select an order below or click "Record Payment" to process payment with real-time receipt generation.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {unpaidOrders.slice(0, 3).map(uo => (
              <button
                key={uo.orderId}
                onClick={() => openRecordModal(uo)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 107, 0, 0.4)',
                  color: '#FFFFFF'
                }}
              >
                Pay Order #{uo.orderId} (Rs. {Number(uo.totalPrice).toLocaleString()})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Live Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search receipt #, order ID, customer..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '40px', width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ height: '40px', width: '100%', backgroundColor: '#1E293B', color: '#FFFFFF' }}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              className="form-input"
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              style={{ height: '40px', width: '100%', backgroundColor: '#1E293B', color: '#FFFFFF' }}
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Credit/Debit Card</option>
              <option value="ONLINE_PAYMENT">Online Payment</option>
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
            </select>
          </div>

          {/* Branch Filter */}
          {!isCustomer && branches.length > 0 && (
            <div>
              {isAdmin ? (
                <select
                  className="form-input"
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                  style={{ height: '40px', width: '100%', backgroundColor: '#1E293B', color: '#FFFFFF' }}
                >
                  <option value="ALL">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="form-input"
                  value={user?.branchId || ''}
                  disabled
                  style={{ height: '40px', width: '100%', backgroundColor: '#1E293B', color: '#94A3B8', cursor: 'not-allowed' }}
                >
                  {branches.filter(b => b.id === user?.branchId).map(b => (
                    <option key={b.id} value={b.id}>{b.branchName}</option>
                  ))}
                  {branches.filter(b => b.id === user?.branchId).length === 0 && (
                    <option value={user?.branchId || ''}>{user?.branchName || 'My Branch'}</option>
                  )}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#A0A0B0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading transactions...</p>
        </div>
      ) : (
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Order</th>
                  {!isCustomer && <th>Customer</th>}
                  <th>Branch</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayPayments.map(p => {
                  const methodConf = METHOD_CONFIG[p.paymentMethod] || METHOD_CONFIG.CASH;
                  const statusConf = STATUS_BADGE[p.paymentStatus] || STATUS_BADGE.PENDING;

                  return (
                    <tr key={p.id}>
                      {/* Receipt */}
                      <td>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700, 
                          color: '#38BDF8', 
                          backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          border: '1px solid rgba(56, 189, 248, 0.2)'
                        }}>
                          {p.receiptNumber || `RCP-COL-00${p.id}`}
                        </span>
                      </td>

                      {/* Order */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>Order #{p.orderId}</span>
                          {p.orderStatus && (
                            <span className={`badge status-${p.orderStatus}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              {p.orderStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      {!isCustomer && (
                        <td style={{ color: '#E2E8F0', fontWeight: 600 }}>
                          {p.customerName || 'Customer'}
                        </td>
                      )}

                      {/* Branch */}
                      <td style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                        {p.branchName || 'Colombo Central'}
                      </td>

                      {/* Amount */}
                      <td style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.98rem' }}>
                        Rs. {(p.amount || 0).toLocaleString()}
                      </td>

                      {/* Method */}
                      <td>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '0.82rem', 
                          color: methodConf.color,
                          backgroundColor: methodConf.bg,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontWeight: 600
                        }}>
                          <span>{methodConf.icon}</span> {methodConf.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: statusConf.color,
                          backgroundColor: statusConf.bg,
                          padding: '3px 8px',
                          borderRadius: '50px'
                        }}>
                          {p.paymentStatus === 'PAID' && <FiCheck size={12} />}
                          {p.paymentStatus}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: '0.85rem', color: '#A0A0B0' }}>
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Pending'}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openInvoiceModal(p)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Print or view receipt invoice"
                          >
                            <FiFileText size={13} /> Receipt
                          </button>

                          {isManager && p.paymentStatus === 'PENDING' && (
                            <button
                              onClick={() => handleQuickMarkPaid(p)}
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Mark this payment as PAID"
                            >
                              <FiCheck size={13} /> Mark Paid
                            </button>
                          )}

                          {isManager && (
                            <button
                              onClick={() => openStatusModal(p)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Update Status"
                            >
                              ⚙️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!displayPayments.length && (
                  <tr>
                    <td colSpan={isCustomer ? 8 : 9} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1.1rem' }}>No payment records found</div>
                      <div style={{ color: '#888899', fontSize: '0.85rem', marginTop: '4px' }}>
                        Try adjusting your filters, search term, or click "Record Payment" to settle an order.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {modal === 'record' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '560px', 
              backgroundColor: '#0F172A', 
              border: '1px solid rgba(255, 107, 0, 0.4)',
              borderRadius: '16px',
              padding: '2rem',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💳</span> Record Order Payment
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                  Select an order, verify amount, and issue an official payment receipt.
                </p>
              </div>
              <button className="btn btn-icon" onClick={() => setModal(null)} style={{ color: '#94A3B8' }}>
                <FiX size={20} />
              </button>
            </div>

            {recordError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FiAlertTriangle size={16} /> {recordError}
              </div>
            )}

            <form onSubmit={handleRecordSubmit}>
              {/* Select Order */}
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                  Select Order Awaiting Payment *
                </label>
                <select
                  className="form-input"
                  value={recordForm.orderId}
                  onChange={e => handleOrderSelect(e.target.value)}
                  required
                  style={{ backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: 'rgba(255, 107, 0, 0.3)', height: '42px', width: '100%' }}
                >
                  <option value="">-- Choose Order to Settle --</option>
                  {unpaidOrders.map(o => (
                    <option key={o.orderId} value={o.orderId}>
                      Order #{o.orderId} — {o.customerName} (Rs. {Number(o.totalPrice).toLocaleString()} · {o.orderStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Info Banner */}
              {selectedOrderInfo && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Customer</span>
                    <strong style={{ color: '#FFFFFF' }}>{selectedOrderInfo.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Branch</span>
                    <strong style={{ color: '#FFFFFF' }}>{selectedOrderInfo.branchName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Order Status</span>
                    <span className={`badge status-${selectedOrderInfo.orderStatus}`} style={{ fontSize: '0.7rem' }}>
                      {selectedOrderInfo.orderStatus}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Required Amount</span>
                    <strong style={{ color: '#22C55E', fontSize: '1.1rem' }}>
                      Rs. {Number(selectedOrderInfo.totalPrice).toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                  Payment Amount (LKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 1950.00"
                  value={recordForm.amount}
                  onChange={e => setRecordForm({ ...recordForm, amount: e.target.value })}
                  required
                  style={{ backgroundColor: '#1E293B', color: '#FFFFFF', height: '42px', width: '100%', fontSize: '1.05rem', fontWeight: 700 }}
                />
                {selectedOrderInfo && Number(recordForm.amount) > selectedOrderInfo.totalPrice && (
                  <span style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                    ⚠️ Amount cannot exceed order total of Rs. {selectedOrderInfo.totalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>
                  Payment Method *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'CASH', label: 'Cash at Counter', icon: '💵' },
                    { key: 'CARD', label: 'Credit / Debit Card', icon: '💳' },
                    { key: 'ONLINE_PAYMENT', label: 'Online Payment', icon: '🌐' },
                    { key: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', icon: '🚚' }
                  ].map(m => (
                    <div
                      key={m.key}
                      onClick={() => setRecordForm({ ...recordForm, paymentMethod: m.key })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: recordForm.paymentMethod === m.key ? '2px solid #FF6B00' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: recordForm.paymentMethod === m.key ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: recordForm.paymentMethod === m.key ? 700 : 500, color: recordForm.paymentMethod === m.key ? '#FF6B00' : '#E2E8F0' }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Transaction Reference */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                    Payment Status
                  </label>
                  <select
                    className="form-input"
                    value={recordForm.paymentStatus}
                    onChange={e => setRecordForm({ ...recordForm, paymentStatus: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF', height: '40px', width: '100%' }}
                  >
                    <option value="PAID">PAID (Clear Instantly)</option>
                    <option value="PENDING">PENDING (Collect Later)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                    Reference / Slip #
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TXN-VISA-991"
                    value={recordForm.transactionReference}
                    onChange={e => setRecordForm({ ...recordForm, transactionReference: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF', height: '40px', width: '100%' }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? 'Processing...' : 'Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {modal === 'status' && selectedPayment && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '460px', 
              backgroundColor: '#0F172A', 
              borderRadius: '16px',
              padding: '1.75rem',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FF6B00' }}>
                Update Payment Status
              </h3>
              <button className="btn btn-icon" onClick={() => setModal(null)} style={{ color: '#94A3B8' }}>
                <FiX size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '1rem' }}>
              Updating Receipt <strong>{selectedPayment.receiptNumber}</strong> for Order #{selectedPayment.orderId} (Rs. {Number(selectedPayment.amount).toLocaleString()}).
            </p>

            <form onSubmit={handleStatusSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#CBD5E1', display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  New Payment Status
                </label>
                <select
                  className="form-input"
                  value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  style={{ backgroundColor: '#1E293B', color: '#FFFFFF', height: '40px', width: '100%' }}
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ color: '#CBD5E1', display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  Transaction Reference Note
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. TXN-REF-UPDATED"
                  value={statusForm.transactionReference}
                  onChange={e => setStatusForm({ ...statusForm, transactionReference: e.target.value })}
                  style={{ backgroundColor: '#1E293B', color: '#FFFFFF', height: '40px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT / TAX INVOICE MODAL */}
      {modal === 'invoice' && selectedPayment && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '660px', 
              backgroundColor: '#0F172A', 
              border: '1px solid rgba(255, 107, 0, 0.35)',
              borderRadius: '16px',
              padding: '2.2rem',
              color: '#FFFFFF'
            }}
          >
            {/* Header with Branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 900, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🫧</span> SMARTWASH PRO LAUNDRY
                </h2>
                <div style={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  {selectedPayment.branchName || 'Colombo Central Branch'} · Tax Reg: LK-9928174<br />
                  Tel: +94 11 234 5678 · Web: www.smartwashpro.lk
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: selectedPayment.paymentStatus === 'PAID' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: `1px solid ${selectedPayment.paymentStatus === 'PAID' ? '#22C55E' : '#F59E0B'}`,
                  color: selectedPayment.paymentStatus === 'PAID' ? '#22C55E' : '#F59E0B',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  letterSpacing: '1px'
                }}>
                  {selectedPayment.paymentStatus === 'PAID' ? 'OFFICIAL RECEIPT' : 'PAYMENT DUE INVOICE'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                  Generated on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Receipt Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              padding: '1.1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>RECEIPT NUMBER</span>
                <strong style={{ fontFamily: 'monospace', color: '#38BDF8', fontSize: '1rem' }}>
                  {selectedPayment.receiptNumber || `RCP-COL-00${selectedPayment.id}`}
                </strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>ORDER REFERENCE</span>
                <strong style={{ color: '#FFFFFF' }}>Order #{selectedPayment.orderId}</strong>
                {selectedPayment.orderStatus && (
                  <span className={`badge status-${selectedPayment.orderStatus}`} style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                    {selectedPayment.orderStatus}
                  </span>
                )}
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>DATE & TIME</span>
                <span style={{ color: '#CBD5E1' }}>
                  {selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleString() : 'Pending Clearance'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>PAYMENT METHOD</span>
                <span style={{ color: '#FF6B00', fontWeight: 700 }}>
                  {selectedPayment.paymentMethod?.replace(/_/g, ' ')}
                </span>
                {selectedPayment.transactionReference && (
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>
                    Ref: {selectedPayment.transactionReference}
                  </span>
                )}
              </div>
            </div>

            {/* Billed To */}
            <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', padding: '0 0.25rem' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Billed To
              </div>
              <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
                {selectedPayment.customerName || invoiceOrder?.customer?.fullName || 'Valued Customer'}
              </div>
              <div style={{ color: '#A0A0B0', fontSize: '0.8rem' }}>
                {invoiceOrder?.customer?.phoneNumber || '0771234567'} · {invoiceOrder?.customer?.email || 'customer@smartwash.com'}
              </div>
              {invoiceOrder?.customer?.address && (
                <div style={{ color: '#A0A0B0', fontSize: '0.8rem' }}>
                  {invoiceOrder.customer.address}
                </div>
              )}
            </div>

            {/* Itemized Line Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Services Breakdown
              </div>
              {invoiceLoading ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748B' }}>Loading itemized details...</div>
              ) : invoiceOrder?.items && invoiceOrder.items.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8', textAlign: 'left' }}>
                      <th style={{ padding: '6px 0' }}>Service Description</th>
                      <th style={{ padding: '6px 0', textAlign: 'center' }}>Quantity</th>
                      <th style={{ padding: '6px 0', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: '6px 0', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceOrder.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px 0', color: '#E2E8F0' }}>{it.serviceName}</td>
                        <td style={{ padding: '8px 0', textAlign: 'center', color: '#94A3B8' }}>{it.quantity}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: '#94A3B8' }}>Rs. {Number(it.unitPrice || 0).toLocaleString()}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: '#FFFFFF', fontWeight: 600 }}>Rs. {Number(it.subtotal || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', color: '#94A3B8', fontSize: '0.85rem' }}>
                  Professional Laundry & Fabric Care Service · Amount: Rs. {Number(selectedPayment.amount || 0).toLocaleString()}
                </div>
              )}
            </div>

            {/* Total Section */}
            <div style={{ borderTop: '2px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginBottom: '1.5rem', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '0.9rem', color: '#94A3B8', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>Rs. {Number(selectedPayment.amount || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '0.9rem', color: '#94A3B8', marginBottom: '8px' }}>
                <span>Taxes & Eco Wash Charges:</span>
                <span>Rs. 0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '1.3rem', fontWeight: 900, color: '#FF6B00' }}>
                <span>Total Settled:</span>
                <span>Rs. {Number(selectedPayment.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Print & Close Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setModal(null)} 
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                Close
              </button>
              <button 
                onClick={() => window.print()} 
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <FiPrinter size={16} /> Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
