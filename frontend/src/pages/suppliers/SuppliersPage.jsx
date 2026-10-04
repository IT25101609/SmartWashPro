import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiTruck, FiPhone, FiMail, FiMapPin, FiUser, FiPackage,
  FiCheckCircle, FiXCircle, FiSearch, FiPlus, FiEdit2,
  FiTrash2, FiToggleLeft, FiToggleRight, FiEye, FiLink,
  FiRefreshCw, FiExternalLink, FiLayers, FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  supplierName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  status: 'ACTIVE'
};

export default function SuppliersPage() {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER';

  // Data States
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allInventory, setAllInventory] = useState([]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals: null | 'create' | 'edit' | 'details' | 'associate' | 'delete'
  const [modal, setModal] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Supplied items for the selected supplier
  const [suppliedItems, setSuppliedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Associate item state
  const [selectedItemToAssociate, setSelectedItemToAssociate] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = { size: 100 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/suppliers', { params });
      setSuppliers(res.data?.content || []);
    } catch (err) {
      console.error('Failed to load suppliers', err);
      toast.error('Failed to load suppliers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, statusFilter]);

  // Load Inventory for linking
  useEffect(() => {
    api.get('/inventory', { params: { size: 200 } })
      .then(res => setAllInventory(res.data?.content || []))
      .catch(() => {});
  }, []);

  // Compute Metrics
  const metrics = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let totalItems = 0;

    suppliers.forEach(s => {
      if (s.status === 'ACTIVE') active++;
      else inactive++;
      totalItems += (s.suppliedItemsCount || 0);
    });

    return { total: suppliers.length, active, inactive, totalItems };
  }, [suppliers]);

  // Modal Openers
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setError('');
    setModal('create');
  };

  const openEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setForm({
      supplierName: supplier.supplierName || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status || 'ACTIVE'
    });
    setFormErrors({});
    setError('');
    setModal('edit');
  };

  const openDetails = async (supplier) => {
    setSelectedSupplier(supplier);
    setModal('details');
    setLoadingItems(true);
    try {
      const res = await api.get(`/suppliers/${supplier.id}/items`);
      setSuppliedItems(res.data || []);
    } catch (err) {
      toast.error('Failed to load supplied inventory items');
      setSuppliedItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const openAssociate = (supplier) => {
    setSelectedSupplier(supplier);
    setSelectedItemToAssociate('');
    setError('');
    setModal('associate');
  };

  const openDelete = (supplier) => {
    setSelectedSupplier(supplier);
    setError('');
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedSupplier(null);
    setFormErrors({});
    setError('');
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!form.supplierName.trim() || form.supplierName.trim().length < 2) {
      errs.supplierName = 'Supplier name must be at least 2 characters long.';
    }
    if (!form.contactPerson.trim()) {
      errs.contactPerson = 'Contact person is required.';
    }
    const phoneClean = form.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneClean || phoneClean.length < 7) {
      errs.phone = 'Valid phone number with at least 7 digits is required.';
    }
    if (form.email && (!form.email.includes('@') || !form.email.includes('.'))) {
      errs.email = 'Invalid email address format.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      const payload = {
        supplierName: form.supplierName.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        status: form.status
      };

      if (modal === 'create') {
        await api.post('/suppliers', payload);
        toast.success('Supplier added successfully');
      } else {
        await api.put(`/suppliers/${selectedSupplier.id}`, payload);
        toast.success('Supplier updated successfully');
      }
      closeModal();
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save supplier details');
    } finally {
      setSaving(false);
    }
  };

  // Activate / Deactivate Toggle
  const handleToggleStatus = async (supplier) => {
    try {
      const res = await api.put(`/suppliers/${supplier.id}/toggle-status`);
      toast.success(`Supplier "${supplier.supplierName}" is now ${res.data.status}`);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to update supplier status');
    }
  };

  // Associate Inventory Item
  const handleAssociateItem = async (e) => {
    e.preventDefault();
    if (!selectedItemToAssociate) {
      setError('Please select an inventory item to link');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const itemId = parseInt(selectedItemToAssociate);
      await api.post(`/suppliers/${selectedSupplier.id}/associate-items`, [itemId]);
      toast.success('Inventory item linked to supplier');

      // Refresh items list
      const itemsRes = await api.get(`/suppliers/${selectedSupplier.id}/items`);
      setSuppliedItems(itemsRes.data || []);

      closeModal();
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link item to supplier');
    } finally {
      setSaving(false);
    }
  };

  // Disassociate Item
  const handleDisassociateItem = async (inventoryId) => {
    try {
      await api.delete(`/suppliers/${selectedSupplier.id}/items/${inventoryId}`);
      toast.success('Item unlinked from supplier');
      const itemsRes = await api.get(`/suppliers/${selectedSupplier.id}/items`);
      setSuppliedItems(itemsRes.data || []);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to unlink item');
    }
  };

  // Delete
  const handleDelete = async () => {
    setSaving(true);
    setError('');

    try {
      await api.delete(`/suppliers/${selectedSupplier.id}`);
      toast.success('Supplier removed successfully');
      closeModal();
      fetchSuppliers();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      setError(msg || 'Failed to delete supplier. Please check if items are linked.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', color: '#fff' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#FF6B00' }}><FiTruck /></span> Supplier Management
          </h1>
          <p style={{ color: 'var(--text-secondary, #A0A0B0)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Manage commercial detergent, packaging, and equipment suppliers and link inventory SKUs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchSuppliers}
            title="Refresh Suppliers"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          {isAdminOrManager && (
            <button
              className="btn btn-primary"
              onClick={openCreate}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
            >
              <FiPlus size={18} /> Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Total Suppliers */}
        <div className="card-glass" style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255, 107, 0, 0.15)', background: 'rgba(18, 18, 26, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A0A0B0', fontSize: '0.85rem' }}>
            <span>Total Suppliers</span>
            <FiTruck size={18} style={{ color: '#FF8C38' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>{metrics.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Registered vendor profiles</div>
        </div>

        {/* Active Suppliers */}
        <div
          className="card-glass"
          style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(18, 18, 26, 0.7)', cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22C55E', fontSize: '0.85rem' }}>
            <span>Active Vendors</span>
            <FiCheckCircle size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#22C55E' }}>{metrics.active}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Active for purchase orders</div>
        </div>

        {/* Inactive Suppliers */}
        <div
          className="card-glass"
          style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(18, 18, 26, 0.7)', cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A0A0B0', fontSize: '0.85rem' }}>
            <span>Inactive / On-Hold</span>
            <FiXCircle size={18} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#A0A0B0' }}>{metrics.inactive}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Suspended or obsolete vendors</div>
        </div>

        {/* Supplied SKUs */}
        <div className="card-glass" style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255, 107, 0, 0.2)', background: 'rgba(18, 18, 26, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A0A0B0', fontSize: '0.85rem' }}>
            <span>Supplied SKUs</span>
            <FiLayers size={18} style={{ color: '#FF6B00' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px', color: '#FF8C38' }}>{metrics.totalItems}</div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>Associated inventory products</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-glass" style={{ padding: 16, borderRadius: 12, marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 220 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#707080' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search suppliers, contact person, phone, email, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map(s => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  border: active ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? '#FF6B00' : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : '#A0A0B0',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {s === 'ALL' ? 'All Suppliers' : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suppliers Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#A0A0B0' }}>Loading suppliers...</p>
        </div>
      ) : (
        <div className="card-glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 107, 0, 0.06)', borderBottom: '1px solid rgba(255, 107, 0, 0.15)' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Supplier Company</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Contact Person</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Phone Number</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px' }}>Address</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px' }}>Supplied SKUs</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: '#707080' }}>
                      <FiTruck size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#A0A0B0' }}>No suppliers found</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Add your first vendor record to link inventory items.</div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map(s => {
                    const isActive = s.status === 'ACTIVE';
                    const count = s.suppliedItemsCount || 0;

                    return (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          opacity: isActive ? 1 : 0.65
                        }}
                      >
                        {/* Company Name */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🏢</span> {s.supplierName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#888' }}>ID: #{s.id}</div>
                        </td>

                        {/* Contact Person */}
                        <td style={{ padding: '12px 16px', color: '#A0A0B0', fontSize: '0.88rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiUser size={13} style={{ color: '#FF6B00' }} />
                            <span>{s.contactPerson || '—'}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '12px 16px', fontSize: '0.88rem' }}>
                          <a
                            href={`tel:${s.phone}`}
                            style={{ color: '#38BDF8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <FiPhone size={13} /> {s.phone}
                          </a>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                          {s.email ? (
                            <a
                              href={`mailto:${s.email}`}
                              style={{ color: '#FF8C38', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              <FiMail size={13} /> {s.email}
                            </a>
                          ) : '—'}
                        </td>

                        {/* Address */}
                        <td style={{ padding: '12px 16px', color: '#A0A0B0', fontSize: '0.85rem', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.address}>
                            {s.address || '—'}
                          </div>
                        </td>

                        {/* Supplied SKUs (Clickable) */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => openDetails(s)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: count > 0 ? '1px solid rgba(255, 107, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                              background: count > 0 ? 'rgba(255, 107, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                              color: count > 0 ? '#FF8C38' : '#888',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                            title="Click to view supplied inventory items"
                          >
                            <FiPackage size={13} /> {count} {count === 1 ? 'item' : 'items'}
                          </button>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: 12,
                            background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                            color: isActive ? '#22C55E' : '#888',
                            border: isActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {isActive ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                            {s.status || 'ACTIVE'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            {/* View Details */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                              onClick={() => openDetails(s)}
                              title="View supplier details and supplied inventory"
                            >
                              <FiEye size={13} />
                            </button>

                            {isAdminOrManager && (
                              <>
                                {/* Link Items */}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                                  onClick={() => openAssociate(s)}
                                  title="Associate inventory item"
                                >
                                  <FiLink size={13} />
                                </button>

                                {/* Edit */}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                                  onClick={() => openEdit(s)}
                                  title="Edit supplier information"
                                >
                                  <FiEdit2 size={13} />
                                </button>

                                {/* Toggle Active/Inactive */}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', color: isActive ? '#22C55E' : '#A0A0B0' }}
                                  onClick={() => handleToggleStatus(s)}
                                  title={isActive ? 'Deactivate supplier' : 'Activate supplier'}
                                >
                                  {isActive ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />}
                                </button>

                                {/* Delete */}
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                                  onClick={() => openDelete(s)}
                                  title="Delete supplier"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </>
                            )}
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
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTruck style={{ color: '#FF6B00' }} />
                {modal === 'create' ? 'Add New Supplier' : `Edit Supplier — ${selectedSupplier?.supplierName}`}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Supplier Company Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Company / Supplier Name *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. Hemas Manufacturing Ltd"
                    value={form.supplierName}
                    onChange={e => setForm({ ...form, supplierName: e.target.value })}
                  />
                  {formErrors.supplierName && (
                    <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 4 }}>{formErrors.supplierName}</div>
                  )}
                </div>

                {/* Contact Person */}
                <div>
                  <label className="form-label">Contact Person *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. Ruwan Jayasinghe"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  />
                  {formErrors.contactPerson && (
                    <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 4 }}>{formErrors.contactPerson}</div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. +94 11 234 5678"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                  {formErrors.phone && (
                    <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 4 }}>{formErrors.phone}</div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. sales@hemas.lk"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                  {formErrors.email && (
                    <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 4 }}>{formErrors.email}</div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="form-label">Vendor Status *</label>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE (Active Supplier)</option>
                    <option value="INACTIVE">INACTIVE (On-Hold / Suspended)</option>
                  </select>
                </div>

                {/* Address */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Physical Office / Factory Address</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. 52 Negombo Road, Peliyagoda"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Supplier' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER DETAILS & SUPPLIED ITEMS MODAL */}
      {modal === 'details' && selectedSupplier && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTruck style={{ color: '#FF6B00' }} /> {selectedSupplier.supplierName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {/* Profile Overview Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>Contact Person</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff', marginTop: 2 }}>{selectedSupplier.contactPerson || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>Direct Telephone</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#38BDF8', marginTop: 2 }}>{selectedSupplier.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>Email</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#FF8C38', marginTop: 2 }}>{selectedSupplier.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>Vendor Status</div>
                <div style={{ marginTop: 2 }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 10, background: selectedSupplier.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)', color: selectedSupplier.status === 'ACTIVE' ? '#22C55E' : '#888', fontWeight: 700 }}>
                    {selectedSupplier.status}
                  </span>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>Factory / Facility Address</div>
                <div style={{ fontSize: '0.88rem', color: '#A0A0B0', marginTop: 2 }}>{selectedSupplier.address || 'No physical address provided.'}</div>
              </div>
            </div>

            {/* Supplied Inventory Items Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiPackage style={{ color: '#FF6B00' }} /> Supplied Inventory Items ({suppliedItems.length})
              </h4>
              {isAdminOrManager && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => openAssociate(selectedSupplier)}
                >
                  <FiLink size={13} /> Link Another Item
                </button>
              )}
            </div>

            {loadingItems ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#A0A0B0', fontSize: '0.85rem' }}>Loading supplied items...</p>
              </div>
            ) : suppliedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <FiPackage size={36} style={{ color: '#555', marginBottom: 8 }} />
                <div style={{ color: '#A0A0B0', fontSize: '0.9rem' }}>No inventory items currently associated with this supplier.</div>
                <div style={{ fontSize: '0.78rem', color: '#777', marginTop: 4 }}>Click "Link Another Item" to assign inventory products.</div>
              </div>
            ) : (
              <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suppliedItems.map(item => (
                  <div
                    key={item.id}
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
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                        {item.itemName}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.78rem', color: '#888' }}>
                        <span>Category: <strong style={{ color: '#A0A0B0' }}>{item.category}</strong></span>
                        <span>Unit Cost: <strong style={{ color: '#FF8C38' }}>Rs. {Number(item.unitCost || 0).toFixed(2)}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#888' }}>Current Stock</div>
                        <div style={{ fontWeight: 700, color: item.outOfStock ? '#EF4444' : (item.lowStock ? '#F59E0B' : '#22C55E') }}>
                          {item.quantity} {item.unit}
                        </div>
                      </div>

                      {isAdminOrManager && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#EF4444' }}
                          onClick={() => handleDisassociateItem(item.id)}
                          title="Unlink this item from supplier"
                        >
                          Unlink
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ASSOCIATE INVENTORY ITEM MODAL */}
      {modal === 'associate' && selectedSupplier && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiLink style={{ color: '#FF6B00' }} /> Associate Item — {selectedSupplier.supplierName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAssociateItem}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: 'var(--text-secondary, #A0A0B0)', fontSize: '0.88rem', margin: 0 }}>
                  Select an inventory item to assign <strong>{selectedSupplier.supplierName}</strong> as its preferred commercial vendor:
                </p>

                <div>
                  <label className="form-label">Inventory Item *</label>
                  <select
                    className="form-input"
                    required
                    value={selectedItemToAssociate}
                    onChange={e => setSelectedItemToAssociate(e.target.value)}
                  >
                    <option value="">— Choose inventory item —</option>
                    {allInventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemName} (Category: {item.category}, Current: {item.supplierName || 'No Supplier'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Linking...' : 'Confirm Association'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modal === 'delete' && selectedSupplier && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTrash2 style={{ color: '#EF4444' }} /> Delete Supplier
              </h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {error ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '12px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <FiAlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{error}</div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary, #A0A0B0)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 16px' }}>
                Are you sure you want to remove <strong style={{ color: '#fff' }}>{selectedSupplier.supplierName}</strong>?
                {selectedSupplier.suppliedItemsCount > 0 && (
                  <span style={{ display: 'block', marginTop: 8, color: '#F59E0B' }}>
                    ⚠️ Note: This supplier is currently associated with {selectedSupplier.suppliedItemsCount} inventory items.
                  </span>
                )}
              </p>
            )}

            <div className="modal-footer">
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
