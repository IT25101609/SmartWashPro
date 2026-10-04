import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function PlaceOrderPage() {
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([{ serviceId: '', quantity: 1, specialInstruction: '' }]);
  const [form, setForm] = useState({
    paymentMethod: 'CASH',
    specialInstructions: '',
    requestPickup: false,
    pickupAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role && user.role !== 'CUSTOMER') {
      navigate('/orders');
      return;
    }
    api.get('/services/available').then(res => setServices(res.data)).catch(() => {});
  }, [user, navigate]);

  const addItem = () => setItems([...items, { serviceId: '', quantity: 1, specialInstruction: '' }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const svc = services.find(s => String(s.id) === String(item.serviceId));
      return sum + (svc ? svc.price * Number(item.quantity) : 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.every(i => !i.serviceId)) { setError('Please add at least one service'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        items: items.filter(i => i.serviceId).map(i => ({ serviceId: Number(i.serviceId), quantity: Number(i.quantity), specialInstruction: i.specialInstruction })),
        paymentMethod: form.paymentMethod,
        specialInstructions: form.specialInstructions,
        requestPickup: form.requestPickup,
        pickupAddress: form.pickupAddress || undefined,
      };
      const res = await api.post('/orders', payload);
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-left"><h1>Place New Order</h1><p>Select services and specify your requirements</p></div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>

        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-header">
            <h3 className="card-title">🧺 Select Services</h3>
            <button type="button" className="btn btn-sm btn-secondary" onClick={addItem}>➕ Add Item</button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} style={{ background: 'var(--color-bg-card-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '12px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Service</label>
                  <select className="form-input" value={item.serviceId} onChange={e => updateItem(idx, 'serviceId', e.target.value)}>
                    <option value="">Select service...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.serviceName} — Rs. {s.price} / {s.pricingType?.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity / Weight</label>
                  <input type="number" className="form-input" min="0.1" step="0.1"
                    value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Special Instruction (optional)</label>
                <input type="text" className="form-input" placeholder="e.g. cold wash, delicate cycle..."
                  value={item.specialInstruction} onChange={e => updateItem(idx, 'specialInstruction', e.target.value)} />
              </div>
              {item.serviceId && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                    Subtotal: Rs. {(services.find(s => String(s.id) === String(item.serviceId))?.price || 0) * Number(item.quantity)}
                  </span>
                  {items.length > 1 && (
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(idx)}>Remove</button>
                  )}
                </div>
              )}
            </div>
          ))}
          <div style={{ padding: '16px', background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Total: Rs. {getTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>📋 Order Details</h3>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-input" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="DIGITAL_PAYMENT">Digital Payment</option>
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
            </select>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Special Instructions</label>
            <textarea className="form-input" rows={3} placeholder="Any special handling instructions..."
              value={form.specialInstructions} onChange={e => setForm({...form, specialInstructions: e.target.value})} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: form.requestPickup ? 16 : 0 }}>
            <input type="checkbox" id="pickup" checked={form.requestPickup}
              onChange={e => setForm({...form, requestPickup: e.target.checked})}
              style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
            <label htmlFor="pickup" style={{ fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>🚗 Request Pickup Service</label>
          </div>
          {form.requestPickup && (
            <div className="form-group">
              <label className="form-label">Pickup Address</label>
              <input type="text" className="form-input" placeholder="Enter your pickup address" required
                value={form.pickupAddress} onChange={e => setForm({...form, pickupAddress: e.target.value})} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? '⏳ Placing Order...' : '✅ Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
