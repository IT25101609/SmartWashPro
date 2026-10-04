import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_FLOW = ['PLACED', 'RECEIVED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchOrder = () => {
    setLoading(true);
    api.get(`/orders/${id}`).then(res => setOrder(res.data)).finally(() => setLoading(false));
  };
  useEffect(fetchOrder, [id]);

  const nextStatus = () => {
    if (!order) return null;
    const idx = STATUS_FLOW.indexOf(order.orderStatus);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { status });
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>;

  const isManager = ['BRANCH_MANAGER_ADMIN', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role);
  const canUpdateStatus = isManager;
  const canCustomerCancel = ['PLACED', 'RECEIVED'].includes(order.orderStatus);
  const next = nextStatus();

  const handleCancelOrder = async () => {
    if (!window.confirm(`Are you sure you want to cancel Order #${id}?`)) return;
    setUpdating(true);
    try {
      await api.delete(`/orders/${id}`);
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Order #{order.id}</h1>
          <p>Placed on {order.orderDate ? new Date(order.orderDate).toLocaleString() : '—'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={`badge status-${order.orderStatus}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {order.orderStatus?.replace(/_/g,' ')}
          </span>
          {canUpdateStatus && next && (
            <button className="btn btn-primary" disabled={updating} onClick={() => updateStatus(next)}>
              {updating ? '⏳...' : `→ Mark as ${next.replace(/_/g,' ')}`}
            </button>
          )}
          {(canUpdateStatus || canCustomerCancel) && order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
            <button className="btn btn-danger btn-sm" disabled={updating} onClick={handleCancelOrder}>Cancel Order</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>📍 Order Journey</h3>
        <div style={{ display: 'flex', gap: 0, minWidth: 600 }}>
          {STATUS_FLOW.map((s, i) => {
            const current = STATUS_FLOW.indexOf(order.orderStatus);
            const done = i <= current && order.orderStatus !== 'CANCELLED';
            const isActive = i === current;
            return (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, top: 16, right: '50%',
                    height: 3, background: done ? 'var(--color-primary)' : 'var(--color-border)', zIndex: 0
                  }}></div>
                )}
                {i < STATUS_FLOW.length - 1 && (
                  <div style={{
                    position: 'absolute', left: '50%', top: 16, right: 0,
                    height: 3, background: i < current ? 'var(--color-primary)' : 'var(--color-border)', zIndex: 0
                  }}></div>
                )}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', zIndex: 1,
                  background: isActive ? 'var(--color-primary)' : done ? 'var(--color-success)' : 'var(--color-bg-card-2)',
                  border: `3px solid ${done ? (isActive ? 'var(--color-primary)' : 'var(--color-success)') : 'var(--color-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', color: done ? 'white' : 'var(--color-text-muted)', fontWeight: 700
                }}>{done ? '✓' : i + 1}</div>
                <p style={{ fontSize: '0.62rem', marginTop: 6, color: done ? 'var(--color-text-primary)' : 'var(--color-text-muted)', textAlign: 'center', fontWeight: isActive ? 700 : 400 }}>
                  {s.replace(/_/g,'\n')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>🧺 Order Items</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Service</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(order.items || []).map(item => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.serviceName}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {item.unitPrice?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Rs. {item.subtotal?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', textAlign: 'right', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              Total: Rs. {order.totalPrice?.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>👤 Customer</h3>
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{order.customer?.fullName}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{order.customer?.email}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{order.customer?.phoneNumber}</p>
          </div>

          {order.payment && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12 }}>💳 Payment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Amount</span>
                  <span style={{ fontWeight: 700 }}>Rs. {order.payment.amount?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Method</span>
                  <span>{order.payment.paymentMethod?.replace(/_/g,' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Status</span>
                  <span className={`badge status-${order.payment.paymentStatus}`}>{order.payment.paymentStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Receipt</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.payment.receiptNumber}</span>
                </div>
              </div>
            </div>
          )}

          {order.specialInstructions && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12 }}>📝 Special Instructions</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{order.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>📜 Status History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(order.statusHistory || []).map(h => (
            <div key={h.id} style={{
              display: 'flex', gap: 16, padding: '12px 0',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div style={{ width: 4, borderRadius: 4, background: 'var(--color-primary)', flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  {h.oldStatus && <span className={`badge status-${h.oldStatus}`}>{h.oldStatus.replace(/_/g,' ')}</span>}
                  {h.oldStatus && <span style={{ color: 'var(--color-text-muted)' }}>→</span>}
                  <span className={`badge status-${h.newStatus}`}>{h.newStatus.replace(/_/g,' ')}</span>
                </div>
                {h.remarks && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{h.remarks}</p>}
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
                  by {h.changedBy} · {h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
