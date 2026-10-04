import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiPackage, FiAlertTriangle, FiAlertCircle, FiCheckCircle,
  FiSearch, FiPlus, FiEdit2, FiClock, FiTrash2,
  FiDollarSign, FiLayers,
  FiRefreshCw, FiArrowUpRight, FiArrowDownRight, FiSliders
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories', icon: '📦' },
  { value: 'DETERGENT', label: 'Detergents & Powders', icon: '🧼' },
  { value: 'CHEMICAL', label: 'Chemicals & Solvents', icon: '🧪' },
  { value: 'PACKAGING', label: 'Packaging & Bags', icon: '🛍️' },
  { value: 'EQUIPMENT_PART', label: 'Equipment Parts', icon: '⚙️' },
  { value: 'OTHER', label: 'Cleaning & Supplies', icon: '🧹' }
];

const EMPTY_FORM = {
  itemName: '',
  category: 'DETERGENT',
  quantity: '',
  unit: '',
  minimumStockLevel: '',
  unitCost: '',
  supplierId: '',
  branchId: '',
  isActive: true
};

export default function InventoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  // Data States
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | IN_STOCK | LOW_STOCK | OUT_OF_STOCK
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Modals: null | 'create' | 'edit' | 'movement' | 'history' | 'delete'
  const [modal, setModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Movement Form (Restock / Use / Adjust)
  const [movementType, setMovementType] = useState('RESTOCK'); // RESTOCK | USAGE | ADJUSTMENT
  const [movementForm, setMovementForm] = useState({ quantity: '', notes: '' });

  // History State
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch Inventory
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = {
        size: 100
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (!includeInactive) params.isActive = true;
      if (isAdmin && selectedBranch !== 'ALL') params.branchId = selectedBranch;

      const res = await api.get('/inventory', { params });
      setItems(res.data?.content || []);
    } catch (err) {
      console.error('Failed to load inventory', err);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, selectedCategory, statusFilter, includeInactive, selectedBranch]);

  // Load Suppliers & Branches
  useEffect(() => {
    api.get('/suppliers', { params: { size: 100 } })
      .then(res => setSuppliers(res.data?.content || []))
      .catch(() => {});

    if (isAdmin) {
      api.get('/admin/branches')
        .then(res => setBranches(res.data || []))
        .catch(() => {});
    }
  }, [isAdmin]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalItems = items.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValuation = 0;

    items.forEach(item => {
      const q = Number(item.quantity) || 0;
      const min = Number(item.minimumStockLevel) || 0;
      const cost = Number(item.unitCost) || 0;
      totalValuation += (q * cost);

      if (q <= 0) {
        outOfStock++;
      } else if (q < min) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { totalItems, inStock, lowStock, outOfStock, totalValuation };
  }, [items]);

  // Modal Openers
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      branchId: branches.length > 0 ? branches[0].id : ''
    });
    setError('');
    setModal('create');
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm({
      itemName: item.itemName || '',
      category: item.category || 'DETERGENT',
      quantity: item.quantity != null ? item.quantity : '',
      unit: item.unit || '',
      minimumStockLevel: item.minimumStockLevel != null ? item.minimumStockLevel : '',
      unitCost: item.unitCost != null ? item.unitCost : '',
      supplierId: item.supplierId || '',
      branchId: item.branchId || '',
      isActive: item.isActive !== false
    });
    setError('');
    setModal('edit');
  };

  const openMovement = (item, defaultType = 'RESTOCK') => {
    setSelectedItem(item);
    setMovementType(defaultType);
    setMovementForm({ quantity: '', notes: '' });
    setError('');
    setModal('movement');
  };

  const openHistory = async (item) => {
    setSelectedItem(item);
    setModal('history');
    setLoadingTx(true);
    try {
      const res = await api.get(`/inventory/${item.id}/transactions`);
      setTransactions(res.data || []);
    } catch (err) {
      toast.error('Failed to load item transaction history');
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  };

  const openDelete = (item) => {
    setSelectedItem(item);
    setError('');
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedItem(null);
    setError('');
  };

  // Actions
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const qty = parseFloat(form.quantity);
    const minStock = parseFloat(form.minimumStockLevel);
    const cost = parseFloat(form.unitCost) || 0;

    if (qty < 0 || minStock < 0 || cost < 0) {
      setError('Quantities and costs cannot be negative');
      setSaving(false);
      return;
    }

    try {
      await api.post('/inventory', {
        itemName: form.itemName.trim(),
        category: form.category,
        quantity: qty,
        unit: form.unit.trim(),
        minimumStockLevel: minStock,
        unitCost: cost,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        branchId: form.branchId ? parseInt(form.branchId) : null,
        isActive: form.isActive
      });
      toast.success('Inventory item created successfully');
      closeModal();
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const minStock = parseFloat(form.minimumStockLevel);
    const cost = parseFloat(form.unitCost) || 0;

    if (minStock < 0 || cost < 0) {
      setError('Minimum stock level and cost cannot be negative');
      setSaving(false);
      return;
    }

    try {
      await api.put(`/inventory/${selectedItem.id}`, {
        itemName: form.itemName.trim(),
        category: form.category,
        unit: form.unit.trim(),
        minimumStockLevel: minStock,
        unitCost: cost,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        branchId: form.branchId ? parseInt(form.branchId) : null,
        isActive: form.isActive
      });
      toast.success('Inventory item updated successfully');
      closeModal();
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleStockMovement = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const amount = parseFloat(movementForm.quantity);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive quantity');
      setSaving(false);
      return;
    }

    const currentStock = Number(selectedItem.quantity) || 0;

    // Strict frontend validation against negative stock
    if (movementType === 'USAGE' && amount > currentStock) {
      setError(`Cannot consume ${amount} ${selectedItem.unit}. Available stock is only ${currentStock} ${selectedItem.unit}. Stock must never become negative.`);
      setSaving(false);
      return;
    }

    try {
      if (movementType === 'RESTOCK') {
        await api.post(`/inventory/${selectedItem.id}/restock`, {
          quantity: amount,
          notes: movementForm.notes.trim() || 'Manual Restock'
        });
        toast.success(`Restocked +${amount} ${selectedItem.unit}`);
      } else if (movementType === 'USAGE') {
        await api.post(`/inventory/${selectedItem.id}/use`, {
          quantity: amount,
          notes: movementForm.notes.trim() || 'Operational Usage'
        });
        toast.success(`Consumed -${amount} ${selectedItem.unit}`);
      } else if (movementType === 'ADJUSTMENT') {
        await api.post(`/inventory/${selectedItem.id}/adjust`, {
          quantity: amount,
          notes: movementForm.notes.trim() || 'Physical Count Reconciliation'
        });
        toast.success(`Stock level reconciled to ${amount} ${selectedItem.unit}`);
      }
      closeModal();
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const res = await api.put(`/inventory/${item.id}/toggle-status`);
      toast.success(`Item "${item.itemName}" ${res.data.isActive ? 'activated' : 'deactivated'}`);
      fetchInventory();
    } catch (err) {
      toast.error('Failed to change item status');
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      // Try soft deactivation or standard delete
      await api.delete(`/inventory/${selectedItem.id}`);
      toast.success('Item removed or deactivated');
      closeModal();
      fetchInventory();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('foreign key') || msg.includes('constraint')) {
        setError('Cannot permanently delete this item because it has transaction history. It will be deactivated instead.');
        try {
          await api.put(`/inventory/${selectedItem.id}/deactivate`);
          toast.success('Item deactivated instead');
          closeModal();
          fetchInventory();
          return;
        } catch (_) {}
      }
      setError(msg || 'Failed to delete item');
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
            <span style={{ color: '#FF6B00' }}><FiPackage /></span> Inventory & Stock Management
          </h1>
          <p style={{ color: 'var(--text-secondary, #A0A0B0)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Real-time stock tracking, automated low/out-of-stock detection, and transaction audit trails
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchInventory}
            title="Refresh Stock List"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/stock-transactions')}
            title="View Complete Stock Movement Ledger"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiSliders /> Stock Movements Ledger
          </button>
          <button
            className="btn btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
          >
            <FiPlus size={18} /> Add Inventory Item
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Total Items */}
        <div className="card-glass" style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255, 107, 0, 0.15)', background: 'rgba(18, 18, 26, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#A0A0B0', fontSize: '0.85rem' }}>
            <span>Total SKUs</span>
            <FiLayers size={18} style={{ color: '#FF8C38' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>{metrics.totalItems}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Tracked supplies across branches</div>
        </div>

        {/* In Stock */}
        <div className="card-glass" style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(18, 18, 26, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#A0A0B0', fontSize: '0.85rem' }}>
            <span>In Stock</span>
            <FiCheckCircle size={18} style={{ color: '#22C55E' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#22C55E' }}>{metrics.inStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Healthy stock levels &ge; minimum</div>
        </div>

        {/* Low Stock Alert */}
        <div
          className="card-glass"
          style={{
            padding: 18,
            borderRadius: 12,
            border: metrics.lowStock > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 107, 0, 0.15)',
            background: metrics.lowStock > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(18, 18, 26, 0.7)',
            cursor: 'pointer'
          }}
          onClick={() => setStatusFilter(statusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          title="Click to toggle Low Stock filter"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#F59E0B', fontSize: '0.85rem' }}>
            <span>Low Stock Alert</span>
            <FiAlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#F59E0B' }}>{metrics.lowStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Stock below safe threshold</div>
        </div>

        {/* Out of Stock Alert */}
        <div
          className="card-glass"
          style={{
            padding: 18,
            borderRadius: 12,
            border: metrics.outOfStock > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 107, 0, 0.15)',
            background: metrics.outOfStock > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(18, 18, 26, 0.7)',
            cursor: 'pointer'
          }}
          onClick={() => setStatusFilter(statusFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
          title="Click to toggle Out of Stock filter"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#EF4444', fontSize: '0.85rem' }}>
            <span>Out of Stock</span>
            <FiAlertCircle size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#EF4444' }}>{metrics.outOfStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Depleted stock (0 units remaining)</div>
        </div>

        {/* Total Valuation */}
        <div className="card-glass" style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255, 107, 0, 0.2)', background: 'rgba(18, 18, 26, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#A0A0B0', fontSize: '0.85rem' }}>
            <span>Total Valuation</span>
            <FiDollarSign size={18} style={{ color: '#FF6B00' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, margin: '8px 0 4px', color: '#FF8C38' }}>
            Rs. {metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Asset valuation at current unit cost</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {CATEGORIES.map(cat => {
          const active = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                border: active ? '1px solid #FF6B00' : '1px solid rgba(255, 255, 255, 0.08)',
                background: active ? 'rgba(255, 107, 0, 0.15)' : 'rgba(18, 18, 26, 0.5)',
                color: active ? '#FF8C38' : '#A0A0B0',
                cursor: 'pointer',
                fontWeight: active ? 600 : 500,
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="card-glass" style={{ padding: 14, borderRadius: 10, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#707080' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search items, chemicals, packaging, suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Status' },
            { id: 'IN_STOCK', label: 'In Stock' },
            { id: 'LOW_STOCK', label: '⚠️ Low Stock' },
            { id: 'OUT_OF_STOCK', label: '🚨 Out of Stock' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: '0.78rem',
                border: statusFilter === s.id ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                background: statusFilter === s.id ? '#FF6B00' : 'rgba(255,255,255,0.04)',
                color: statusFilter === s.id ? '#fff' : '#A0A0B0',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Branch Filter for Admin */}
        {isAdmin && branches.length > 0 && (
          <select
            className="form-input"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{ width: 'auto', minWidth: 150 }}
          >
            <option value="ALL">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
            ))}
          </select>
        )}

        {/* Inactive Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: '#A0A0B0', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            style={{ accentColor: '#FF6B00', cursor: 'pointer' }}
          />
          Include Deactivated Items
        </label>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#A0A0B0' }}>Loading inventory items...</p>
        </div>
      ) : (
        <div className="card-glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 107, 0, 0.06)', borderBottom: '1px solid rgba(255, 107, 0, 0.15)' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Item & Unit</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px' }}>Current Stock</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px' }}>Min Level</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px' }}>Total Value</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Supplier</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: '#707080' }}>
                      <FiPackage size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#A0A0B0' }}>No inventory items found</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Try clearing search or filters, or add a new stock item.</div>
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const q = Number(item.quantity) || 0;
                    const min = Number(item.minimumStockLevel) || 0;
                    const cost = Number(item.unitCost) || 0;
                    const isOut = q <= 0;
                    const isLow = !isOut && q < min;
                    const isActive = item.isActive !== false;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          opacity: isActive ? 1 : 0.6,
                          background: isOut ? 'rgba(239, 68, 68, 0.03)' : (isLow ? 'rgba(245, 158, 11, 0.02)' : 'transparent')
                        }}
                      >
                        {/* Name & Unit */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                            {item.itemName}
                            {!isActive && (
                              <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#888' }}>
                                Inactive
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>Unit: {item.unit || 'units'}</div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(255, 107, 0, 0.1)',
                            color: '#FF8C38',
                            border: '1px solid rgba(255, 107, 0, 0.2)'
                          }}>
                            {item.category?.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: isOut ? '#EF4444' : (isLow ? '#F59E0B' : '#22C55E')
                        }}>
                          {q} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#888' }}>{item.unit}</span>
                        </td>

                        {/* Min Level */}
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#A0A0B0', fontSize: '0.88rem' }}>
                          {min} <span style={{ fontSize: '0.75rem', color: '#666' }}>{item.unit}</span>
                        </td>

                        {/* Unit Cost */}
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#fff', fontSize: '0.88rem' }}>
                          Rs. {cost.toFixed(2)}
                        </td>

                        {/* Total Value */}
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#FF8C38', fontSize: '0.88rem' }}>
                          Rs. {(q * cost).toFixed(2)}
                        </td>

                        {/* Supplier */}
                        <td style={{ padding: '12px 16px', color: '#A0A0B0', fontSize: '0.85rem' }}>
                          {item.supplierName || '—'}
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {!isActive ? (
                            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#888', fontWeight: 600 }}>
                              DEACTIVATED
                            </span>
                          ) : isOut ? (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              borderRadius: 12,
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <FiAlertCircle size={13} /> OUT OF STOCK
                            </span>
                          ) : isLow ? (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              borderRadius: 12,
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <FiAlertTriangle size={13} /> LOW STOCK
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              borderRadius: 12,
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#22C55E',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <FiCheckCircle size={13} /> IN STOCK
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            {/* Stock Movement Button */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '5px 9px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() => openMovement(item, isOut || isLow ? 'RESTOCK' : 'USAGE')}
                              title="Restock or Use stock"
                            >
                              <FiSliders size={13} /> Adjust
                            </button>

                            {/* Stock History Button */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                              onClick={() => openHistory(item)}
                              title="View Stock Transaction History"
                            >
                              <FiClock size={13} />
                            </button>

                            {/* Edit Button */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                              onClick={() => openEdit(item)}
                              title="Edit item properties"
                            >
                              <FiEdit2 size={13} />
                            </button>


                            {/* Delete Button */}
                            <button
                              className="btn btn-danger"
                              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                              onClick={() => openDelete(item)}
                              title="Delete or Deactivate"
                            >
                              <FiTrash2 size={13} />
                            </button>
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

      {/* CREATE / EDIT MODAL */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiPackage style={{ color: '#FF6B00' }} />
                {modal === 'create' ? 'Add Inventory Item' : `Edit Item — ${selectedItem?.itemName}`}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, margin: '0 0 16px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Item Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Item Name *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. Ariel Washing Powder 25kg"
                    value={form.itemName}
                    onChange={e => setForm({ ...form, itemName: e.target.value })}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.filter(c => c.value !== 'ALL').map(c => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="form-label">Unit of Measure *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. kg, litres, boxes, pcs"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                  />
                </div>

                {/* Initial Stock (Only for create) */}
                {modal === 'create' ? (
                  <div>
                    <label className="form-label">Initial Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      required
                      placeholder="0.00"
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="form-label">Current Stock</label>
                    <input
                      className="form-input"
                      disabled
                      value={`${selectedItem?.quantity} ${selectedItem?.unit}`}
                      style={{ opacity: 0.7 }}
                    />
                    <small style={{ color: '#888', fontSize: '0.72rem' }}>To update stock, use the Adjust button</small>
                  </div>
                )}

                {/* Minimum Stock Level */}
                <div>
                  <label className="form-label">Minimum Stock Level *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    required
                    placeholder="e.g. 10.00"
                    value={form.minimumStockLevel}
                    onChange={e => setForm({ ...form, minimumStockLevel: e.target.value })}
                  />
                  <small style={{ color: '#888', fontSize: '0.72rem' }}>Alert triggers when stock &lt; minimum</small>
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="form-label">Unit Cost (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={form.unitCost}
                    onChange={e => setForm({ ...form, unitCost: e.target.value })}
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="form-label">Preferred Supplier</label>
                  <select
                    className="form-input"
                    value={form.supplierId}
                    onChange={e => setForm({ ...form, supplierId: e.target.value })}
                  >
                    <option value="">— None / Direct —</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplierName}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Selection (Admin only) */}
                {isAdmin && branches.length > 0 && (
                  <div>
                    <label className="form-label">Branch *</label>
                    <select
                      className="form-input"
                      value={form.branchId}
                      onChange={e => setForm({ ...form, branchId: e.target.value })}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Active Checkbox */}
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    style={{ accentColor: '#FF6B00', width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label htmlFor="isActiveCheck" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                    Active Item (available for operations)
                  </label>
                </div>
              </div>

              {/* Real-time Status Preview */}
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#A0A0B0' }}>Projected Stock Status:</span>
                {(() => {
                  const q = parseFloat(form.quantity) || 0;
                  const min = parseFloat(form.minimumStockLevel) || 0;
                  if (q <= 0) return <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.85rem' }}>🚨 OUT OF STOCK (0 {form.unit})</span>;
                  if (q < min) return <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.85rem' }}>⚠️ LOW STOCK ({q} &lt; {min})</span>;
                  return <span style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.85rem' }}>✅ IN STOCK ({q} &ge; {min})</span>;
                })()}
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT MODAL (Restock / Use / Adjust) */}
      {modal === 'movement' && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiSliders style={{ color: '#FF6B00' }} /> Stock Movement — {selectedItem.itemName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {/* Current Stock Banner */}
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255, 107, 0, 0.08)', border: '1px solid rgba(255, 107, 0, 0.2)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Current On-Hand Stock</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                  {selectedItem.quantity} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#FF8C38' }}>{selectedItem.unit}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Min Safety Level</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#A0A0B0' }}>{selectedItem.minimumStockLevel} {selectedItem.unit}</div>
              </div>
            </div>

            {/* Movement Type Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { type: 'RESTOCK', label: '📥 Restock (+)', color: '#22C55E' },
                { type: 'USAGE', label: '📤 Use / Consume (-)', color: '#38BDF8' },
                { type: 'ADJUSTMENT', label: '⚖️ Reconcile (=)', color: '#A855F7' }
              ].map(t => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => { setMovementType(t.type); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: movementType === t.type ? `1px solid ${t.color}` : '1px solid rgba(255,255,255,0.08)',
                    background: movementType === t.type ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    color: movementType === t.type ? t.color : '#A0A0B0'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleStockMovement}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label">
                    {movementType === 'RESTOCK' ? 'Quantity to Add (+)' : movementType === 'USAGE' ? 'Quantity Consumed (-)' : 'New Actual Count (=)'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    required
                    placeholder="Enter quantity"
                    value={movementForm.quantity}
                    onChange={e => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Reference / Purpose / Notes</label>
                  <input
                    className="form-input"
                    placeholder={movementType === 'RESTOCK' ? 'e.g. PO #1084 Hemas Delivery' : movementType === 'USAGE' ? 'e.g. Shift 1 Machine batch 4' : 'e.g. Monthly Physical Stock Audit'}
                    value={movementForm.notes}
                    onChange={e => setMovementForm({ ...movementForm, notes: e.target.value })}
                  />
                </div>

                {/* Calculation Preview */}
                {movementForm.quantity && (
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ color: '#A0A0B0' }}>Resulting Stock Level:</span>
                      {(() => {
                        const cur = Number(selectedItem.quantity) || 0;
                        const amt = parseFloat(movementForm.quantity) || 0;
                        let next = cur;
                        if (movementType === 'RESTOCK') next = cur + amt;
                        else if (movementType === 'USAGE') next = cur - amt;
                        else if (movementType === 'ADJUSTMENT') next = amt;

                        const isNegative = next < 0;
                        const min = Number(selectedItem.minimumStockLevel) || 0;
                        const status = next <= 0 ? 'OUT OF STOCK' : (next < min ? 'LOW STOCK' : 'IN STOCK');

                        return (
                          <span style={{ fontWeight: 700, color: isNegative ? '#EF4444' : (next <= 0 ? '#EF4444' : (next < min ? '#F59E0B' : '#22C55E')) }}>
                            {next} {selectedItem.unit} ({status})
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || (movementType === 'USAGE' && parseFloat(movementForm.quantity) > Number(selectedItem.quantity))}
                >
                  {saving ? 'Updating...' : movementType === 'RESTOCK' ? 'Confirm Restock' : movementType === 'USAGE' ? 'Confirm Usage' : 'Confirm Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK TRANSACTION HISTORY MODAL */}
      {modal === 'history' && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiClock style={{ color: '#FF6B00' }} /> Stock History — {selectedItem.itemName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 16 }}>
              <div>
                <span style={{ color: '#888', fontSize: '0.75rem' }}>Current Balance: </span>
                <strong style={{ color: '#fff' }}>{selectedItem.quantity} {selectedItem.unit}</strong>
              </div>
              <div>
                <span style={{ color: '#888', fontSize: '0.75rem' }}>Min Safety Level: </span>
                <strong style={{ color: '#A0A0B0' }}>{selectedItem.minimumStockLevel} {selectedItem.unit}</strong>
              </div>
            </div>

            {loadingTx ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#A0A0B0', fontSize: '0.85rem' }}>Loading transaction history...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#707080' }}>
                <FiClock size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <div>No stock transactions recorded for this item yet.</div>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {transactions.map(tx => {
                  const isRestock = tx.transactionType === 'RESTOCK';
                  const isUsage = tx.transactionType === 'USAGE';
                  const isAdjustment = tx.transactionType === 'ADJUSTMENT';

                  const badgeColor = isRestock ? '#22C55E' : (isUsage ? '#38BDF8' : '#A855F7');
                  const badgeBg = isRestock ? 'rgba(34, 197, 94, 0.12)' : (isUsage ? 'rgba(56, 189, 248, 0.12)' : 'rgba(168, 85, 247, 0.12)');

                  return (
                    <div
                      key={tx.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: badgeBg, color: badgeColor, fontWeight: 700 }}>
                            {tx.transactionType}
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                            {isRestock ? `+${tx.quantity}` : (isUsage ? `-${tx.quantity}` : `Δ ${tx.quantity}`)} {selectedItem.unit}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#A0A0B0', marginTop: 4 }}>
                          {tx.notes || 'No description provided'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 2 }}>
                          Logged by: {tx.createdByName || 'System'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                          Balance: <span style={{ color: '#fff', fontWeight: 600 }}>{tx.newQuantity} {selectedItem.unit}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 2 }}>
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modal === 'delete' && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTrash2 style={{ color: '#EF4444' }} /> Remove Item
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <p style={{ color: 'var(--text-secondary, #A0A0B0)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 16px' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>{selectedItem.itemName}</strong>?
              If this item has existing stock transaction history, it will be automatically archived / deactivated instead of broken.
            </p>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" disabled={saving} onClick={handleDelete}>
                {saving ? 'Deleting...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
