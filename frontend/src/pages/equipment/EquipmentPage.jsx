import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import equipmentService from '../../services/equipmentService';
import branchService from '../../services/branchService';
import toast from 'react-hot-toast';
import {
  FiSettings, FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw,
  FiTool, FiAlertOctagon, FiClock, FiCheckCircle, FiXCircle,
  FiLayers, FiMapPin, FiCalendar, FiDollarSign, FiActivity, FiX
} from 'react-icons/fi';

const STATUS_OPTS = ['ACTIVE', 'MAINTENANCE', 'BROKEN', 'INACTIVE'];

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', badge: 'badge-success', icon: '✅', color: '#22c55e' },
  MAINTENANCE: { label: 'Maintenance', badge: 'badge-warning', icon: '🔧', color: '#f59e0b' },
  UNDER_MAINTENANCE: { label: 'Maintenance', badge: 'badge-warning', icon: '🔧', color: '#f59e0b' },
  BROKEN: { label: 'Broken', badge: 'badge-error', icon: '⚠️', color: '#ef4444' },
  INACTIVE: { label: 'Inactive', badge: 'badge-neutral', icon: '⏸️', color: '#6b7280' },
  RETIRED: { label: 'Inactive', badge: 'badge-neutral', icon: '⏸️', color: '#6b7280' }
};

const SEVERITY_CONFIG = {
  LOW: { label: 'Low', badge: 'badge-info' },
  MEDIUM: { label: 'Medium', badge: 'badge-warning' },
  HIGH: { label: 'High', badge: 'badge-error' },
  CRITICAL: { label: 'Critical', badge: 'badge-error' }
};

const EQUIPMENT_TYPES = [
  'WASHER',
  'DRYER',
  'IRONING_PRESS',
  'STEAM_BOILER',
  'FOLDING_MACHINE',
  'DRY_CLEANER',
  'OTHER'
];

const EMPTY_FORM = {
  equipmentName: '',
  equipmentType: 'WASHER',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  nextMaintenanceDate: '',
  status: 'ACTIVE',
  branchId: ''
};

const EMPTY_MAINT = {
  scheduledDate: new Date().toISOString().split('T')[0],
  maintenanceType: '',
  description: '',
  performedBy: '',
  cost: ''
};

const EMPTY_BREAKDOWN = {
  reportedDate: new Date().toISOString().split('T')[0],
  severity: 'MEDIUM',
  description: ''
};

const F = ({ label, required, children }) => (
  <div className="form-group" style={{ marginBottom: 12 }}>
    <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 600 }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {children}
  </div>
);

export default function EquipmentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Data
  const [equipmentList, setEquipmentList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const initialBranchFilter = isAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL');
  const [branchFilter, setBranchFilter] = useState(initialBranchFilter);
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    if (!isAdmin && user?.branchId) {
      setBranchFilter(String(user.branchId));
    }
  }, [isAdmin, user]);

  // Modals: null | 'create' | 'edit' | 'delete' | 'status' | 'branch' | 'maintenance' | 'breakdown' | 'maint_history' | 'breakdown_history'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [maintForm, setMaintForm] = useState(EMPTY_MAINT);
  const [breakdownForm, setBreakdownForm] = useState(EMPTY_BREAKDOWN);
  const [quickStatus, setQuickStatus] = useState('ACTIVE');
  const [quickBranchId, setQuickBranchId] = useState('');

  // Histories
  const [maintHistory, setMaintHistory] = useState([]);
  const [breakdownHistory, setBreakdownHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sub-actions in history modals
  const [completingMaintId, setCompletingMaintId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ completedDate: new Date().toISOString().split('T')[0], cost: '', performedBy: '' });

  const [repairingBdId, setRepairingBdId] = useState(null);
  const [repairForm, setRepairForm] = useState({ repairedDate: new Date().toISOString().split('T')[0], repairCost: '', repairNotes: '' });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load Branches
  useEffect(() => {
    branchService.getBranches()
      .then(res => setBranches(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch Equipment
  const fetchEquipment = () => {
    setLoading(true);
    const params = { size: 100 };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'ALL') params.status = statusFilter;
    const effBranch = !isAdmin && user?.branchId ? user.branchId : (branchFilter !== 'ALL' ? branchFilter : undefined);
    if (effBranch) params.branchId = effBranch;
    if (typeFilter !== 'ALL') params.equipmentType = typeFilter;

    equipmentService.getEquipment(params)
      .then(res => {
        setEquipmentList(res.data?.content || []);
      })
      .catch(err => {
        console.error('Failed to load equipment', err);
        toast.error('Failed to fetch equipment records');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEquipment();
  }, [search, statusFilter, branchFilter, typeFilter]);

  // Statistics Calculation
  const stats = useMemo(() => {
    let total = equipmentList.length;
    let active = 0;
    let maintenance = 0;
    let broken = 0;
    let inactive = 0;

    equipmentList.forEach(e => {
      const s = e.status;
      if (s === 'ACTIVE') active++;
      else if (s === 'MAINTENANCE' || s === 'UNDER_MAINTENANCE') maintenance++;
      else if (s === 'BROKEN') broken++;
      else inactive++;
    });

    return { total, active, maintenance, broken, inactive };
  }, [equipmentList]);

  // Modal Handlers
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      branchId: !isAdmin && user?.branchId ? String(user.branchId) : (branches[0]?.id ? String(branches[0].id) : '')
    });
    setError('');
    setModal('create');
  };

  const openEdit = (e) => {
    setSelected(e);
    setForm({
      equipmentName: e.equipmentName || '',
      equipmentType: e.equipmentType || 'WASHER',
      model: e.model || '',
      serialNumber: e.serialNumber || '',
      purchaseDate: e.purchaseDate || '',
      nextMaintenanceDate: e.nextMaintenanceDate || '',
      status: e.status === 'UNDER_MAINTENANCE' ? 'MAINTENANCE' : (e.status === 'RETIRED' ? 'INACTIVE' : e.status),
      branchId: e.branchId ? String(e.branchId) : ''
    });
    setError('');
    setModal('edit');
  };

  const openAssignBranch = (e) => {
    setSelected(e);
    setQuickBranchId(e.branchId ? String(e.branchId) : (branches[0]?.id ? String(branches[0].id) : ''));
    setError('');
    setModal('branch');
  };

  const openSetStatus = (e) => {
    setSelected(e);
    const normalized = e.status === 'UNDER_MAINTENANCE' ? 'MAINTENANCE' : (e.status === 'RETIRED' ? 'INACTIVE' : e.status);
    setQuickStatus(normalized || 'ACTIVE');
    setError('');
    setModal('status');
  };

  const openScheduleMaint = (e) => {
    setSelected(e);
    setMaintForm(EMPTY_MAINT);
    setError('');
    setModal('maintenance');
  };

  const openReportBreakdown = (e) => {
    setSelected(e);
    setBreakdownForm(EMPTY_BREAKDOWN);
    setError('');
    setModal('breakdown');
  };

  const openMaintHistory = async (e) => {
    setSelected(e);
    setCompletingMaintId(null);
    setModal('maint_history');
    setLoadingHistory(true);
    try {
      const res = await equipmentService.getMaintenanceHistory(e.id);
      setMaintHistory(res.data || []);
    } catch {
      toast.error('Failed to load maintenance history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openBreakdownHistory = async (e) => {
    setSelected(e);
    setRepairingBdId(null);
    setModal('breakdown_history');
    setLoadingHistory(true);
    try {
      const res = await equipmentService.getBreakdownHistory(e.id);
      setBreakdownHistory(res.data || []);
    } catch {
      toast.error('Failed to load breakdown history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openDelete = (e) => {
    setSelected(e);
    setError('');
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
    setCompletingMaintId(null);
    setRepairingBdId(null);
  };

  // Submit Handlers
  const handleCreate = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        branchId: form.branchId ? Number(form.branchId) : null
      };
      await equipmentService.createEquipment(payload);
      toast.success('Equipment registered successfully!');
      closeModal();
      fetchEquipment();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create equipment');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        branchId: form.branchId ? Number(form.branchId) : null
      };
      await equipmentService.updateEquipment(selected.id, payload);
      toast.success('Equipment updated successfully!');
      closeModal();
      fetchEquipment();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update equipment');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignBranch = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await equipmentService.assignBranch(selected.id, quickBranchId ? Number(quickBranchId) : null);
      toast.success('Branch assigned successfully!');
      closeModal();
      fetchEquipment();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign branch');
    } finally {
      setSaving(false);
    }
  };

  const handleSetStatus = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await equipmentService.updateStatus(selected.id, quickStatus);
      toast.success(`Equipment status updated to ${quickStatus}!`);
      closeModal();
      fetchEquipment();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleMaint = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        equipmentId: selected.id,
        scheduledDate: maintForm.scheduledDate,
        maintenanceType: maintForm.maintenanceType,
        description: maintForm.description,
        performedBy: maintForm.performedBy,
        cost: maintForm.cost ? parseFloat(maintForm.cost) : null
      };
      await equipmentService.scheduleMaintenance(selected.id, payload);
      toast.success('Maintenance scheduled! Equipment status updated to MAINTENANCE.');
      closeModal();
      fetchEquipment();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to schedule maintenance');
    } finally {
      setSaving(false);
    }
  };

  const handleReportBreakdown = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        equipmentId: selected.id,
        reportedDate: breakdownForm.reportedDate,
        severity: breakdownForm.severity,
        description: breakdownForm.description
      };
      await equipmentService.reportBreakdown(selected.id, payload);
      toast.error('Breakdown reported! Equipment status updated to BROKEN.');
      closeModal();
      fetchEquipment();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to report breakdown');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteMaint = async (maintId) => {
    setSaving(true);
    try {
      const payload = {
        status: 'COMPLETED',
        completedDate: completeForm.completedDate,
        cost: completeForm.cost ? parseFloat(completeForm.cost) : null,
        performedBy: completeForm.performedBy
      };
      await equipmentService.updateMaintenanceStatus(maintId, payload);
      toast.success('Maintenance completed! Equipment restored to ACTIVE.');
      setCompletingMaintId(null);
      // Reload history and list
      const res = await equipmentService.getMaintenanceHistory(selected.id);
      setMaintHistory(res.data || []);
      fetchEquipment();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to complete maintenance');
    } finally {
      setSaving(false);
    }
  };

  const handleRepairBreakdown = async (bdId) => {
    setSaving(true);
    try {
      const payload = {
        status: 'REPAIRED',
        repairedDate: repairForm.repairedDate,
        repairCost: repairForm.repairCost ? parseFloat(repairForm.repairCost) : null,
        repairNotes: repairForm.repairNotes
      };
      await equipmentService.updateBreakdownStatus(bdId, payload);
      toast.success('Breakdown resolved! Equipment restored to ACTIVE.');
      setRepairingBdId(null);
      // Reload history and list
      const res = await equipmentService.getBreakdownHistory(selected.id);
      setBreakdownHistory(res.data || []);
      fetchEquipment();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to repair breakdown');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await equipmentService.deleteEquipment(selected.id);
      toast.success('Equipment removed successfully.');
      closeModal();
      fetchEquipment();
    } catch (e) {
      const msg = e.response?.data?.message || '';
      if (msg.includes('foreign key') || msg.includes('constraint')) {
        setError('Cannot delete equipment with linked maintenance or breakdown logs.');
      } else {
        setError(msg || 'Failed to delete equipment');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setBranchFilter(isAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL'));
    setTypeFilter('ALL');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <FiSettings style={{ color: 'var(--color-primary, #ff6b00)' }} /> Equipment Management
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.9rem' }}>
            Monitor laundry machines, schedule maintenance, track breakdowns, and assign branch locations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchEquipment} title="Refresh Equipment List">
            <FiRefreshCw /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiPlus /> Add Equipment
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid var(--color-primary, #ff6b00)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>TOTAL MACHINES</span>
            <FiLayers style={{ color: 'var(--color-primary, #ff6b00)', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8 }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Fleet capacity across branches</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>ACTIVE</span>
            <FiCheckCircle style={{ color: '#22c55e', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#22c55e' }}>{stats.active}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Operational & washing ready</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>MAINTENANCE</span>
            <FiTool style={{ color: '#f59e0b', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#f59e0b' }}>{stats.maintenance}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Under routine service or inspection</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>BROKEN</span>
            <FiAlertOctagon style={{ color: '#ef4444', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#ef4444' }}>{stats.broken}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Needs immediate technician repair</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #6b7280' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>INACTIVE</span>
            <FiClock style={{ color: '#6b7280', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#9ca3af' }}>{stats.inactive}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Decommissioned or in reserve</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
          {/* SEARCH */}
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 34, width: '100%' }}
              placeholder="Search name, model, serial..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* STATUS FILTER */}
          <div>
            <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">✅ Active</option>
              <option value="MAINTENANCE">🔧 Maintenance</option>
              <option value="BROKEN">⚠️ Broken</option>
              <option value="INACTIVE">⏸️ Inactive</option>
            </select>
          </div>

          {/* BRANCH FILTER */}
          <div>
            {isAdmin ? (
              <select className="form-input" value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={{ width: '100%' }}>
                <option value="ALL">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode || `#${b.id}`})</option>
                ))}
              </select>
            ) : (
              <select className="form-input" value={user?.branchId || ''} disabled style={{ width: '100%', cursor: 'not-allowed', color: '#94A3B8' }}>
                {branches.filter(b => b.id === user?.branchId).map(b => (
                  <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode || `#${b.id}`})</option>
                ))}
                {branches.filter(b => b.id === user?.branchId).length === 0 && (
                  <option value={user?.branchId || ''}>{user?.branchName || 'My Branch'}</option>
                )}
              </select>
            )}
          </div>

          {/* TYPE FILTER */}
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ flex: 1 }}>
              <option value="ALL">All Types</option>
              {EQUIPMENT_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {(search || statusFilter !== 'ALL' || (isAdmin && branchFilter !== 'ALL') || typeFilter !== 'ALL') && (
              <button className="btn btn-secondary" onClick={resetFilters} title="Reset filters">
                <FiX />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EQUIPMENT TABLE */}
      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>Loading equipment fleet...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Equipment & Model</th>
                  <th>Type</th>
                  <th>Serial Number</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Next Maintenance</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map(e => {
                  const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.ACTIVE;
                  return (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #ffffff)' }}>
                          {e.equipmentName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #9ca3af)' }}>
                          {e.model ? `Model: ${e.model}` : 'Standard Edition'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', padding: '3px 8px', borderRadius: 4, background: 'rgba(255, 107, 0, 0.1)', color: '#ff8c38' }}>
                          {e.equipmentType?.replace(/_/g, ' ') || 'GENERAL'}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.82rem', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
                          {e.serialNumber || '—'}
                        </code>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}>
                          <FiMapPin style={{ color: '#ff6b00', fontSize: '0.85rem' }} />
                          <span>{e.branchName || (e.branchId ? `Branch #${e.branchId}` : 'Unassigned')}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${cfg.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>{cfg.icon}</span> {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {e.nextMaintenanceDate || '—'}
                        </div>
                        {e.lastMaintenanceDate && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Last: {e.lastMaintenanceDate}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Edit Equipment"
                            onClick={() => openEdit(e)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Assign Branch"
                              onClick={() => openAssignBranch(e)}
                            >
                              <FiMapPin /> Branch
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Set Equipment Status"
                            onClick={() => openSetStatus(e)}
                          >
                            <FiActivity /> Status
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#f59e0b' }}
                            title="Schedule Maintenance (sets status to MAINTENANCE)"
                            onClick={() => openScheduleMaint(e)}
                          >
                            <FiTool /> Maint.
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                            title="Report Breakdown (sets status to BROKEN)"
                            onClick={() => openReportBreakdown(e)}
                          >
                            <FiAlertOctagon /> Breakdown
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Maintenance History"
                            onClick={() => openMaintHistory(e)}
                          >
                            📋 M-Log
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Breakdown History"
                            onClick={() => openBreakdownHistory(e)}
                          >
                            💥 B-Log
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Delete Equipment"
                            onClick={() => openDelete(e)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!equipmentList.length && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                        <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚙️</div>
                        <h3 style={{ margin: '0 0 6px 0' }}>No equipment matches your filters</h3>
                        <p style={{ color: 'var(--color-text-secondary, #9ca3af)', marginBottom: 16 }}>
                          Try clearing filters or register a new equipment unit
                        </p>
                        <button className="btn btn-primary" onClick={openCreate}>
                          <FiPlus /> Add Equipment
                        </button>
                      </div>
                    </td>
                  </tr>
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
                {modal === 'create' ? <><FiPlus /> Add New Equipment</> : <><FiEdit2 /> Edit Equipment</>}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <F label="Equipment Name" required>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. Commercial Washing Machine 1"
                    value={form.equipmentName}
                    onChange={e => setForm({ ...form, equipmentName: e.target.value })}
                  />
                </F>

                <F label="Equipment Type" required>
                  <select
                    className="form-input"
                    required
                    value={form.equipmentType}
                    onChange={e => setForm({ ...form, equipmentType: e.target.value })}
                  >
                    {EQUIPMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </F>

                <F label="Model">
                  <input
                    className="form-input"
                    placeholder="e.g. SQ-100 Commercial Pro"
                    value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                  />
                </F>

                <F label="Serial Number">
                  <input
                    className="form-input"
                    placeholder="e.g. SN-883921"
                    value={form.serialNumber}
                    onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                  />
                </F>

                <F label="Branch Location">
                  {isAdmin ? (
                    <select
                      className="form-input"
                      value={form.branchId}
                      onChange={e => setForm({ ...form, branchId: e.target.value })}
                    >
                      <option value="">-- No Branch Assigned --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode || `#${b.id}`})</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="form-input"
                      value={user?.branchId || ''}
                      disabled
                      style={{ cursor: 'not-allowed', color: '#94A3B8' }}
                    >
                      {branches.filter(b => b.id === user?.branchId).map(b => (
                        <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode || `#${b.id}`})</option>
                      ))}
                      {branches.filter(b => b.id === user?.branchId).length === 0 && (
                        <option value={user?.branchId || ''}>{user?.branchName || 'My Branch'}</option>
                      )}
                    </select>
                  )}
                </F>

                <F label="Initial Status" required>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTS.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                    ))}
                  </select>
                </F>

                <F label="Purchase Date">
                  <input
                    type="date"
                    className="form-input"
                    value={form.purchaseDate}
                    onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </F>

                <F label="Next Maintenance Date">
                  <input
                    type="date"
                    className="form-input"
                    value={form.nextMaintenanceDate}
                    onChange={e => setForm({ ...form, nextMaintenanceDate: e.target.value })}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saving...' : (modal === 'create' ? 'Create Equipment' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN BRANCH MODAL */}
      {modal === 'branch' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><FiMapPin /> Assign Branch — {selected?.equipmentName}</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form onSubmit={handleAssignBranch}>
              <F label="Select Branch Location" required>
                <select
                  className="form-input"
                  required
                  value={quickBranchId}
                  onChange={e => setQuickBranchId(e.target.value)}
                >
                  <option value="">-- No Branch Assigned --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode || `#${b.id}`})</option>
                  ))}
                </select>
              </F>
              <div className="modal-footer" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Assigning...' : 'Assign Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SET STATUS MODAL */}
      {modal === 'status' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><FiActivity /> Set Equipment Status — {selected?.equipmentName}</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form onSubmit={handleSetStatus}>
              <F label="Select Equipment Status" required>
                <select
                  className="form-input"
                  required
                  value={quickStatus}
                  onChange={e => setQuickStatus(e.target.value)}
                >
                  {STATUS_OPTS.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s]?.icon} {STATUS_CONFIG[s]?.label || s}</option>
                  ))}
                </select>
              </F>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 14 }}>
                Supported statuses: ACTIVE (ready for washing), MAINTENANCE (under service), BROKEN (needs repair), INACTIVE (retired/standby).
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MAINTENANCE MODAL */}
      {modal === 'maintenance' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
                <FiTool /> Schedule Maintenance — {selected?.equipmentName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#f59e0b' }}>
              ℹ️ <strong>Rule:</strong> Scheduling maintenance will automatically update this equipment's status to <strong>MAINTENANCE</strong>.
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form onSubmit={handleScheduleMaint}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <F label="Scheduled Date" required>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={maintForm.scheduledDate}
                    onChange={e => setMaintForm({ ...maintForm, scheduledDate: e.target.value })}
                  />
                </F>

                <F label="Maintenance Type" required>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. Belt Inspection, Descaling, Motor Check"
                    value={maintForm.maintenanceType}
                    onChange={e => setMaintForm({ ...maintForm, maintenanceType: e.target.value })}
                  />
                </F>

                <F label="Description / Scope of Work">
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Detail the planned service or parts to replace..."
                    value={maintForm.description}
                    onChange={e => setMaintForm({ ...maintForm, description: e.target.value })}
                  />
                </F>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <F label="Performed By / Technician">
                    <input
                      className="form-input"
                      placeholder="e.g. John Doe, In-House Tech"
                      value={maintForm.performedBy}
                      onChange={e => setMaintForm({ ...maintForm, performedBy: e.target.value })}
                    />
                  </F>

                  <F label="Estimated Cost (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={maintForm.cost}
                      onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })}
                    />
                  </F>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Scheduling...' : 'Schedule Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT BREAKDOWN MODAL */}
      {modal === 'breakdown' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
                <FiAlertOctagon /> Report Equipment Breakdown — {selected?.equipmentName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#ef4444' }}>
              ⚠️ <strong>Rule:</strong> Reporting a breakdown will immediately transition this machine's status to <strong>BROKEN</strong>.
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form onSubmit={handleReportBreakdown}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <F label="Reported Date" required>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={breakdownForm.reportedDate}
                      onChange={e => setBreakdownForm({ ...breakdownForm, reportedDate: e.target.value })}
                    />
                  </F>

                  <F label="Severity Level" required>
                    <select
                      className="form-input"
                      required
                      value={breakdownForm.severity}
                      onChange={e => setBreakdownForm({ ...breakdownForm, severity: e.target.value })}
                    >
                      <option value="LOW">Low (Minor noise, fully usable)</option>
                      <option value="MEDIUM">Medium (Degraded performance)</option>
                      <option value="HIGH">High (Stops mid-cycle, urgent)</option>
                      <option value="CRITICAL">Critical (Complete failure / hazard)</option>
                    </select>
                  </F>
                </div>

                <F label="Failure Description" required>
                  <textarea
                    className="form-input"
                    rows={4}
                    required
                    placeholder="Describe what occurred (e.g. water leakage, drum won't spin, electrical smell)..."
                    value={breakdownForm.description}
                    onChange={e => setBreakdownForm({ ...breakdownForm, description: e.target.value })}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={saving}>
                  {saving ? '⏳ Submitting...' : 'Report Breakdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAINTENANCE HISTORY MODAL */}
      {modal === 'maint_history' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 840 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                📋 Maintenance History — {selected?.equipmentName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 10px' }} />
                <p>Loading maintenance records...</p>
              </div>
            ) : maintHistory.length === 0 ? (
              <div className="empty-state" style={{ padding: 30, textAlign: 'center' }}>
                <div className="empty-state-icon" style={{ fontSize: '2rem', marginBottom: 8 }}>🔧</div>
                <h3>No maintenance records found</h3>
                <p style={{ color: '#9ca3af' }}>No scheduled or past service history for this equipment.</p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Scheduled</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Tech</th>
                      <th>Cost</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintHistory.map(m => {
                      const isComplete = m.status === 'COMPLETED';
                      const isCancelled = m.status === 'CANCELLED';
                      return (
                        <tr key={m.id}>
                          <td>
                            <div>{m.scheduledDate}</div>
                            {m.completedDate && (
                              <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Done: {m.completedDate}</div>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{m.maintenanceType}</td>
                          <td style={{ fontSize: '0.85rem', maxWidth: 200 }}>{m.description || '—'}</td>
                          <td>{m.performedBy || '—'}</td>
                          <td>{m.cost ? `Rs. ${m.cost}` : '—'}</td>
                          <td>
                            <span className={`badge ${isComplete ? 'badge-success' : (isCancelled ? 'badge-neutral' : 'badge-warning')}`}>
                              {m.status}
                            </span>
                          </td>
                          <td>
                            {!isComplete && !isCancelled && (
                              completingMaintId === m.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180, background: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 6 }}>
                                  <input
                                    type="date"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: '3px 6px' }}
                                    value={completeForm.completedDate}
                                    onChange={e => setCompleteForm({ ...completeForm, completedDate: e.target.value })}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Final cost"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: '3px 6px' }}
                                    value={completeForm.cost}
                                    onChange={e => setCompleteForm({ ...completeForm, cost: e.target.value })}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Tech name"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: '3px 6px' }}
                                    value={completeForm.performedBy}
                                    onChange={e => setCompleteForm({ ...completeForm, performedBy: e.target.value })}
                                  />
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                      onClick={() => handleCompleteMaint(m.id)}
                                      disabled={saving}
                                    >
                                      ✓ Complete
                                    </button>
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                      onClick={() => setCompletingMaintId(null)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#22c55e' }}
                                  onClick={() => {
                                    setCompletingMaintId(m.id);
                                    setCompleteForm({
                                      completedDate: new Date().toISOString().split('T')[0],
                                      cost: m.cost ? String(m.cost) : '',
                                      performedBy: m.performedBy || ''
                                    });
                                  }}
                                >
                                  Mark Done
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* BREAKDOWN HISTORY MODAL */}
      {modal === 'breakdown_history' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 840 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                💥 Breakdown & Repair History — {selected?.equipmentName}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 10px' }} />
                <p>Loading breakdown history...</p>
              </div>
            ) : breakdownHistory.length === 0 ? (
              <div className="empty-state" style={{ padding: 30, textAlign: 'center' }}>
                <div className="empty-state-icon" style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <h3>No breakdown records reported</h3>
                <p style={{ color: '#9ca3af' }}>This equipment has a clean maintenance and uptime record!</p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reported</th>
                      <th>Severity</th>
                      <th>Description</th>
                      <th>Repair Details</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownHistory.map(b => {
                      const isRepaired = b.status === 'REPAIRED';
                      const isScrapped = b.status === 'SCRAPPED';
                      const sev = SEVERITY_CONFIG[b.severity] || { label: b.severity, badge: 'badge-neutral' };

                      return (
                        <tr key={b.id}>
                          <td>{b.reportedDate}</td>
                          <td>
                            <span className={`badge ${sev.badge}`}>{sev.label}</span>
                          </td>
                          <td style={{ fontSize: '0.85rem', maxWidth: 220 }}>{b.description}</td>
                          <td>
                            {isRepaired ? (
                              <div style={{ fontSize: '0.8rem' }}>
                                <div style={{ color: '#22c55e' }}>Repaired: {b.repairedDate || 'Yes'}</div>
                                {b.repairCost && <div>Cost: Rs. {b.repairCost}</div>}
                                {b.repairNotes && <div style={{ color: '#9ca3af' }}>{b.repairNotes}</div>}
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Pending Repair</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${isRepaired ? 'badge-success' : (isScrapped ? 'badge-neutral' : 'badge-error')}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            {!isRepaired && !isScrapped && (
                              repairingBdId === b.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200, background: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 6 }}>
                                  <input
                                    type="date"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: '3px 6px' }}
                                    value={repairForm.repairedDate}
                                    onChange={e => setRepairForm({ ...repairForm, repairedDate: e.target.value })}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Repair cost"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: '3px 6px' }}
                                    value={repairForm.repairCost}
                                    onChange={e => setRepairForm({ ...repairForm, repairCost: e.target.value })}
                                  />
                                  <textarea
                                    rows={2}
                                    placeholder="Repair notes / replaced parts"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: '3px 6px' }}
                                    value={repairForm.repairNotes}
                                    onChange={e => setRepairForm({ ...repairForm, repairNotes: e.target.value })}
                                  />
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                      onClick={() => handleRepairBreakdown(b.id)}
                                      disabled={saving}
                                    >
                                      ✓ Save Repair
                                    </button>
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                      onClick={() => setRepairingBdId(null)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#22c55e' }}
                                  onClick={() => {
                                    setRepairingBdId(b.id);
                                    setRepairForm({
                                      repairedDate: new Date().toISOString().split('T')[0],
                                      repairCost: b.repairCost ? String(b.repairCost) : '',
                                      repairNotes: b.repairNotes || ''
                                    });
                                  }}
                                >
                                  Mark Repaired
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>🗑️ Delete Equipment</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <p style={{ color: 'var(--color-text-secondary, #9ca3af)', margin: '0 0 16px 0', fontSize: '0.9rem' }}>
              Are you sure you want to permanently delete <strong>{selected?.equipmentName}</strong> (SN: {selected?.serialNumber || 'N/A'})?
              This operation cannot be reversed.
            </p>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" disabled={saving} onClick={handleDelete}>
                {saving ? '⏳ Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
