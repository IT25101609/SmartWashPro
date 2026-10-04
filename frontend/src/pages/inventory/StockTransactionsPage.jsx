import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiSliders, FiArrowUpRight, FiArrowDownRight, FiAlertTriangle,
  FiRotateCcw, FiSearch, FiCalendar, FiPlus, FiRefreshCw,
  FiPackage, FiUser, FiFileText, FiCheck, FiFilter, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  RESTOCK: {
    label: 'RESTOCK',
    icon: <FiArrowUpRight />,
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.25)',
    symbol: '+'
  },
  USAGE: {
    label: 'USAGE',
    icon: <FiArrowDownRight />,
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.25)',
    symbol: '-'
  },
  WASTE: {
    label: 'WASTE',
    icon: <FiAlertTriangle />,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.25)',
    symbol: '-'
  },
  ADJUSTMENT: {
    label: 'ADJUSTMENT',
    icon: <FiRotateCcw />,
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.25)',
    symbol: 'Δ'
  }
};

export default function StockTransactionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Data States
  const [transactions, setTransactions] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedInventoryId, setSelectedInventoryId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    inventoryId: '',
    transactionType: 'RESTOCK',
    quantity: '',
    notes: '',
    employeeId: '',
    transactionDate: new Date().toISOString().slice(0, 16)
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch Transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { size: 100 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (selectedInventoryId !== 'ALL') params.inventoryId = selectedInventoryId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/stock-transactions', { params });
      setTransactions(res.data?.content || []);
    } catch (err) {
      console.error('Failed to load transactions', err);
      toast.error('Failed to load stock transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, typeFilter, selectedInventoryId, startDate, endDate]);

  // Load Inventory Items & Employees for dropdowns
  useEffect(() => {
    api.get('/inventory', { params: { size: 200 } })
      .then(res => setInventoryList(res.data?.content || []))
      .catch(() => {});

    api.get('/employees', { params: { size: 100 } })
      .then(res => setEmployees(res.data?.content || []))
      .catch(() => {});
  }, []);

  // Compute Metrics
  const metrics = useMemo(() => {
    let restocks = 0;
    let usages = 0;
    let wastes = 0;
    let adjustments = 0;

    transactions.forEach(t => {
      if (t.transactionType === 'RESTOCK') restocks++;
      else if (t.transactionType === 'USAGE') usages++;
      else if (t.transactionType === 'WASTE') wastes++;
      else if (t.transactionType === 'ADJUSTMENT') adjustments++;
    });

    return { total: transactions.length, restocks, usages, wastes, adjustments };
  }, [transactions]);

  // Selected item info for modal preview
  const activeItem = useMemo(() => {
    if (!form.inventoryId) return null;
    return inventoryList.find(i => String(i.id) === String(form.inventoryId)) || null;
  }, [form.inventoryId, inventoryList]);

  // Open Modal
  const openRecordModal = (defaultType = 'RESTOCK') => {
    setForm({
      inventoryId: inventoryList.length > 0 ? String(inventoryList[0].id) : '',
      transactionType: defaultType,
      quantity: '',
      notes: '',
      employeeId: user?.id ? String(user.id) : '',
      transactionDate: new Date().toISOString().slice(0, 16)
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  // Submit Transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid positive quantity');
      setSaving(false);
      return;
    }

    if (!activeItem) {
      setError('Please select a valid inventory item');
      setSaving(false);
      return;
    }

    const curStock = Number(activeItem.quantity) || 0;

    // Strict rule: Prevent stock from becoming negative
    if ((form.transactionType === 'USAGE' || form.transactionType === 'WASTE') && qty > curStock) {
      setError(`Cannot record ${form.transactionType.toLowerCase()} of ${qty} ${activeItem.unit}. Available stock is only ${curStock} ${activeItem.unit}. Stock must never become negative.`);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        inventoryId: parseInt(form.inventoryId),
        transactionType: form.transactionType,
        quantity: qty,
        notes: form.notes.trim(),
        employeeId: form.employeeId ? parseInt(form.employeeId) : undefined,
        transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : undefined
      };

      await api.post('/stock-transactions', payload);
      toast.success(`${form.transactionType} transaction recorded successfully`);
      closeModal();
      fetchTransactions();

      // Refresh inventory dropdown quantities
      api.get('/inventory', { params: { size: 200 } })
        .then(res => setInventoryList(res.data?.content || []))
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record stock transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#FF6B00' }}><FiSliders /></span> Stock Transactions & Audit Log
          </h1>
          <p style={{ color: 'var(--text-secondary, #A0A0B0)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Immutable ledger tracking all Restocks, Usages, Waste, and Physical Reconciliations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchTransactions}
            title="Refresh Transactions"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => openRecordModal('RESTOCK')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
          >
            <FiPlus size={18} /> Record Stock Movement
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Total Movements */}
        <div className="card-glass" style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255, 107, 0, 0.15)', background: 'rgba(18, 18, 26, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A0A0B0', fontSize: '0.85rem' }}>
            <span>Total Ledger Entries</span>
            <FiClock size={18} style={{ color: '#FF8C38' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>{metrics.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Complete movement history</div>
        </div>

        {/* Restocks */}
        <div
          className="card-glass"
          style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(18, 18, 26, 0.7)', cursor: 'pointer' }}
          onClick={() => setTypeFilter(typeFilter === 'RESTOCK' ? 'ALL' : 'RESTOCK')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22C55E', fontSize: '0.85rem' }}>
            <span>Restocks (+)</span>
            <FiArrowUpRight size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#22C55E' }}>{metrics.restocks}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Deliveries & supplier restocks</div>
        </div>

        {/* Usages */}
        <div
          className="card-glass"
          style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.2)', background: 'rgba(18, 18, 26, 0.7)', cursor: 'pointer' }}
          onClick={() => setTypeFilter(typeFilter === 'USAGE' ? 'ALL' : 'USAGE')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38BDF8', fontSize: '0.85rem' }}>
            <span>Usages (-)</span>
            <FiArrowDownRight size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#38BDF8' }}>{metrics.usages}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Operational batch consumption</div>
        </div>

        {/* Waste */}
        <div
          className="card-glass"
          style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(18, 18, 26, 0.7)', cursor: 'pointer' }}
          onClick={() => setTypeFilter(typeFilter === 'WASTE' ? 'ALL' : 'WASTE')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444', fontSize: '0.85rem' }}>
            <span>Waste & Spoilage (-)</span>
            <FiAlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#EF4444' }}>{metrics.wastes}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Damaged & expired supplies</div>
        </div>

        {/* Adjustments */}
        <div
          className="card-glass"
          style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(168, 85, 247, 0.2)', background: 'rgba(18, 18, 26, 0.7)', cursor: 'pointer' }}
          onClick={() => setTypeFilter(typeFilter === 'ADJUSTMENT' ? 'ALL' : 'ADJUSTMENT')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A855F7', fontSize: '0.85rem' }}>
            <span>Reconciliations (Δ)</span>
            <FiRotateCcw size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#A855F7' }}>{metrics.adjustments}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Physical audit count syncs</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-glass" style={{ padding: 16, borderRadius: 12, marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#707080' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search items, notes, PO reference, staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>

        {/* Transaction Type Filter Pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {['ALL', 'RESTOCK', 'USAGE', 'WASTE', 'ADJUSTMENT'].map(t => {
            const active = typeFilter === t;
            const cfg = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  border: active ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? '#FF6B00' : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : (cfg ? cfg.color : '#A0A0B0'),
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {cfg && cfg.icon} {t === 'ALL' ? 'All Types' : t}
              </button>
            );
          })}
        </div>

        {/* Inventory Item Filter */}
        <select
          className="form-input"
          value={selectedInventoryId}
          onChange={(e) => setSelectedInventoryId(e.target.value)}
          style={{ width: 'auto', minWidth: 180 }}
        >
          <option value="ALL">All Inventory Items</option>
          {inventoryList.map(item => (
            <option key={item.id} value={item.id}>{item.itemName} ({item.quantity} {item.unit})</option>
          ))}
        </select>

        {/* Date Range Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCalendar style={{ color: '#707080' }} />
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: 140, padding: '6px 10px', fontSize: '0.8rem' }}
            title="Start Date"
          />
          <span style={{ color: '#666' }}>to</span>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: 140, padding: '6px 10px', fontSize: '0.8rem' }}
            title="End Date"
          />
          {(startDate || endDate) && (
            <button
              className="btn btn-secondary"
              onClick={() => { setStartDate(''); setEndDate(''); }}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              title="Clear date filter"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#A0A0B0' }}>Loading stock transactions...</p>
        </div>
      ) : (
        <div className="card-glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 107, 0, 0.06)', borderBottom: '1px solid rgba(255, 107, 0, 0.15)' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Date & Time</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px' }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px' }}>Quantity Delta</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px' }}>Balance Shift</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Reference / Notes</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#707080' }}>
                      <FiSliders size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#A0A0B0' }}>No stock transactions recorded</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Record your first Restock, Usage, or Waste movement.</div>
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => {
                    const cfg = TYPE_CONFIG[tx.transactionType] || TYPE_CONFIG.RESTOCK;
                    const prev = Number(tx.previousQuantity) || 0;
                    const next = Number(tx.newQuantity) || 0;
                    const unit = tx.unit || '';

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {/* Date & Time */}
                        <td style={{ padding: '12px 16px', color: '#fff', fontSize: '0.85rem' }}>
                          <div>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#888' }}>
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </td>

                        {/* Item */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                            {tx.itemName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>SKU #{tx.inventoryId}</div>
                        </td>

                        {/* Type Badge */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {cfg.icon} {tx.transactionType}
                          </span>
                        </td>

                        {/* Quantity Delta */}
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: cfg.color
                        }}>
                          {cfg.symbol} {tx.quantity} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#888' }}>{unit}</span>
                        </td>

                        {/* Balance Shift */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                            <span style={{ color: '#888' }}>{prev}</span>
                            <span style={{ color: '#FF6B00' }}>→</span>
                            <span style={{ fontWeight: 700, color: next <= 0 ? '#EF4444' : '#fff' }}>{next} {unit}</span>
                          </div>
                        </td>

                        {/* Reference / Notes */}
                        <td style={{ padding: '12px 16px', color: '#A0A0B0', fontSize: '0.85rem', maxWidth: 260 }}>
                          {tx.notes || '—'}
                        </td>

                        {/* Recorded By */}
                        <td style={{ padding: '12px 16px', color: '#fff', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiUser size={13} style={{ color: '#FF6B00' }} />
                            <span>{tx.createdByName || 'System'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD TRANSACTION MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiSliders style={{ color: '#FF6B00' }} /> Record Stock Transaction
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Inventory Item Selection */}
                <div>
                  <label className="form-label">Select Inventory Item *</label>
                  <select
                    className="form-input"
                    required
                    value={form.inventoryId}
                    onChange={e => setForm({ ...form, inventoryId: e.target.value })}
                  >
                    <option value="">— Choose item —</option>
                    {inventoryList.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemName} (Available: {item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Stock Banner */}
                {activeItem && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#888' }}>Current On-Hand Balance</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: activeItem.quantity <= 0 ? '#EF4444' : '#22C55E' }}>
                        {activeItem.quantity} {activeItem.unit}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888' }}>Min Stock Safety Level</div>
                      <div style={{ fontSize: '0.9rem', color: '#A0A0B0' }}>{activeItem.minimumStockLevel} {activeItem.unit}</div>
                    </div>
                  </div>
                )}

                {/* Transaction Type Tabs */}
                <div>
                  <label className="form-label">Transaction Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {['RESTOCK', 'USAGE', 'WASTE', 'ADJUSTMENT'].map(t => {
                      const cfg = TYPE_CONFIG[t];
                      const active = form.transactionType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setForm({ ...form, transactionType: t }); setError(''); }}
                          style={{
                            padding: '8px 4px',
                            borderRadius: 8,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: active ? `1px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.08)',
                            background: active ? cfg.bg : 'rgba(255,255,255,0.02)',
                            color: active ? cfg.color : '#A0A0B0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>{cfg.icon}</span>
                          <span>{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="form-label">
                    {form.transactionType === 'RESTOCK' ? 'Quantity to Add (+)' : form.transactionType === 'ADJUSTMENT' ? 'New Target Stock Balance (=)' : 'Quantity to Deduct (-)'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    required
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>

                {/* Calculation Preview */}
                {activeItem && form.quantity && (
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#A0A0B0' }}>Projected Stock Level:</span>
                      {(() => {
                        const cur = Number(activeItem.quantity) || 0;
                        const amt = parseFloat(form.quantity) || 0;
                        let next = cur;
                        if (form.transactionType === 'RESTOCK') next = cur + amt;
                        else if (form.transactionType === 'USAGE' || form.transactionType === 'WASTE') next = cur - amt;
                        else if (form.transactionType === 'ADJUSTMENT') next = amt;

                        const isNegative = next < 0;
                        const min = Number(activeItem.minimumStockLevel) || 0;
                        const status = next <= 0 ? 'OUT OF STOCK' : (next < min ? 'LOW STOCK' : 'IN STOCK');

                        return (
                          <span style={{ fontWeight: 700, color: isNegative ? '#EF4444' : (next <= 0 ? '#EF4444' : (next < min ? '#F59E0B' : '#22C55E')) }}>
                            {next} {activeItem.unit} ({status})
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Employee / Staff */}
                <div>
                  <label className="form-label">Recorded Employee *</label>
                  <select
                    className="form-input"
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  >
                    <option value={user?.id || ''}>Current User ({user?.fullName || user?.email})</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.user?.id || emp.id}>
                        {emp.user?.fullName || emp.fullName} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Date */}
                <div>
                  <label className="form-label">Transaction Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    required
                    value={form.transactionDate}
                    onChange={e => setForm({ ...form, transactionDate: e.target.value })}
                  />
                </div>

                {/* Reference / Notes */}
                <div>
                  <label className="form-label">Reference / PO / Reason / Notes</label>
                  <input
                    className="form-input"
                    placeholder="e.g. PO #1092, Wash Batch #4, Damaged bottle spillage..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || ((form.transactionType === 'USAGE' || form.transactionType === 'WASTE') && activeItem && parseFloat(form.quantity) > Number(activeItem.quantity))}
                >
                  {saving ? 'Saving...' : 'Confirm Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
