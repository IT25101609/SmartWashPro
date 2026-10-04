import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import maintenanceService from '../../services/maintenanceService';
import equipmentService from '../../services/equipmentService';
import employeeService from '../../services/employeeService';
import branchService from '../../services/branchService';
import toast from 'react-hot-toast';
import {
  FiTool, FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle,
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiUser, FiInfo, FiActivity,
  FiLayers, FiMapPin, FiDollarSign, FiX, FiRefreshCw, FiFileText, FiCheck
} from 'react-icons/fi';

const STATUS_COLOR = {
  SCHEDULED: 'badge-warning',
  IN_PROGRESS: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-neutral'
};

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Scheduled', badge: 'badge-warning', icon: '📅', color: '#f59e0b' },
  IN_PROGRESS: { label: 'In Progress', badge: 'badge-info', icon: '🔧', color: '#3b82f6' },
  COMPLETED: { label: 'Completed', badge: 'badge-success', icon: '✅', color: '#22c55e' },
  CANCELLED: { label: 'Cancelled', badge: 'badge-neutral', icon: '✕', color: '#6b7280' }
};

const NEXT_STATUS_OPTIONS = {
  SCHEDULED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

const MAINTENANCE_TYPES = [
  'Routine Inspection',
  'Motor & Drive Belt Service',
  'Drum Bearing Lubrication',
  'Descaling & Filter Cleaning',
  'Heating Element Replacement',
  'Electrical & Sensor Calibration',
  'Suspension & Shock Absorber',
  'Emergency Repair',
  'Other'
];

const EMPTY_FORM = {
  equipmentId: '',
  assignedEmployeeId: '',
  performedBy: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  maintenanceType: 'Routine Inspection',
  problem: '',
  description: '',
  cost: ''
};

const F = ({ label, required, children }) => (
  <div className="form-group" style={{ marginBottom: 12 }}>
    <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 600 }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {children}
  </div>
);

export default function MaintenancePage() {
  const { user } = useAuth();
  const isSystemAdmin = user?.role === 'ADMIN';
  const isAdmin = isSystemAdmin || user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER';

  // Data states
  const [records, setRecords] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | UPCOMING | HISTORY
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const initialBranchFilter = isSystemAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL');
  const [branchFilter, setBranchFilter] = useState(initialBranchFilter);

  useEffect(() => {
    if (!isSystemAdmin && user?.branchId) {
      setBranchFilter(String(user.branchId));
    }
  }, [isSystemAdmin, user]);

  // Modal states: null | 'create' | 'status' | 'details' | 'edit' | 'cancel'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    repairDetails: '',
    cost: '',
    completedDate: new Date().toISOString().split('T')[0],
    performedBy: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial dropdown references
  useEffect(() => {
    const equipParams = { size: 100 };
    if (!isSystemAdmin && user?.branchId) equipParams.branchId = user.branchId;
    equipmentService.getEquipment(equipParams)
      .then(res => setEquipmentList(res.data?.content || []))
      .catch(() => {});

    const empParams = { size: 100 };
    if (!isSystemAdmin && user?.branchId) empParams.branchId = user.branchId;
    employeeService.getEmployees(empParams)
      .then(res => {
        const content = res.data?.content || [];
        setEmployees(content.filter(e => e.employmentStatus === 'ACTIVE'));
      })
      .catch(() => {});

    branchService.getBranches()
      .then(res => setBranches(res.data || []))
      .catch(() => {});
  }, [isSystemAdmin, user]);

  // Fetch maintenance records
  const fetchRecords = () => {
    setLoading(true);
    const params = { size: 100 };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (equipmentFilter !== 'ALL') params.equipmentId = equipmentFilter;
    const effBranch = !isSystemAdmin && user?.branchId ? user.branchId : (branchFilter !== 'ALL' ? branchFilter : undefined);
    if (effBranch) params.branchId = effBranch;

    maintenanceService.getMaintenance(params)
      .then(res => {
        setRecords(res.data?.content || []);
      })
      .catch(err => {
        console.error('Failed to load maintenance records', err);
        toast.error('Failed to load maintenance records');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, [search, statusFilter, equipmentFilter, branchFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    let total = records.length;
    let scheduled = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;

    records.forEach(r => {
      if (r.status === 'SCHEDULED') scheduled++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'COMPLETED') completed++;
      else if (r.status === 'CANCELLED') cancelled++;
    });

    return { total, scheduled, inProgress, completed, cancelled };
  }, [records]);

  // Filter based on active tab
  const tabFilteredRecords = useMemo(() => {
    if (activeTab === 'UPCOMING') {
      return records.filter(r => r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS');
    }
    if (activeTab === 'HISTORY') {
      return records.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');
    }
    return records;
  }, [records, activeTab]);

  // Highlight urgent / upcoming maintenance within next 7 days
  const upcomingAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    return records.filter(r => {
      if (r.status !== 'SCHEDULED' && r.status !== 'IN_PROGRESS') return false;
      if (!r.scheduledDate) return false;
      const sDate = new Date(r.scheduledDate);
      return sDate <= in7Days;
    });
  }, [records]);

  // Modal open handlers
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      equipmentId: equipmentList[0]?.id ? String(equipmentList[0].id) : '',
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    setError('');
    setModal('create');
  };

  const openStatusUpdate = (m) => {
    setSelected(m);
    const defaultNext = NEXT_STATUS_OPTIONS[m.status]?.[0] || 'COMPLETED';
    setStatusUpdateForm({
      status: defaultNext,
      repairDetails: m.repairDetails || '',
      cost: m.cost ? String(m.cost) : '',
      completedDate: m.completedDate || new Date().toISOString().split('T')[0],
      performedBy: m.performedBy || ''
    });
    setError('');
    setModal('status');
  };

  const openDetails = (m) => {
    setSelected(m);
    setModal('details');
  };

  const openEdit = (m) => {
    setSelected(m);
    setForm({
      equipmentId: m.equipmentId ? String(m.equipmentId) : '',
      assignedEmployeeId: m.assignedEmployeeId ? String(m.assignedEmployeeId) : '',
      performedBy: m.performedBy || '',
      scheduledDate: m.scheduledDate || '',
      maintenanceType: m.maintenanceType || 'Routine Inspection',
      problem: m.problem || m.description || '',
      description: m.description || '',
      cost: m.cost ? String(m.cost) : ''
    });
    setError('');
    setModal('edit');
  };

  const openCancel = (m) => {
    setSelected(m);
    setError('');
    setModal('cancel');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
  };

  // Submit Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.equipmentId) {
      setError('Please select an equipment unit');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        equipmentId: Number(form.equipmentId),
        assignedEmployeeId: form.assignedEmployeeId ? Number(form.assignedEmployeeId) : null,
        performedBy: form.performedBy,
        scheduledDate: form.scheduledDate,
        maintenanceType: form.maintenanceType,
        problem: form.problem || form.description,
        description: form.description || form.problem,
        cost: form.cost ? parseFloat(form.cost) : null,
        status: 'SCHEDULED'
      };

      await maintenanceService.create(payload);
      toast.success('Maintenance scheduled! Equipment status updated to MAINTENANCE.');
      closeModal();
      fetchRecords();
      // Also refresh equipment list to reflect new status
      equipmentService.getEquipment({ size: 100 })
        .then(res => setEquipmentList(res.data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule maintenance.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        equipmentId: Number(form.equipmentId),
        assignedEmployeeId: form.assignedEmployeeId ? Number(form.assignedEmployeeId) : null,
        performedBy: form.performedBy,
        scheduledDate: form.scheduledDate,
        maintenanceType: form.maintenanceType,
        problem: form.problem,
        description: form.description || form.problem,
        cost: form.cost ? parseFloat(form.cost) : null
      };

      await maintenanceService.update(selected.id, payload);
      toast.success('Maintenance record updated successfully!');
      closeModal();
      fetchRecords();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update maintenance.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        status: statusUpdateForm.status,
        repairDetails: statusUpdateForm.repairDetails,
        cost: statusUpdateForm.cost ? parseFloat(statusUpdateForm.cost) : null,
        completedDate: statusUpdateForm.status === 'COMPLETED' ? statusUpdateForm.completedDate : null,
        performedBy: statusUpdateForm.performedBy
      };

      await maintenanceService.updateStatus(selected.id, payload);

      if (statusUpdateForm.status === 'COMPLETED') {
        toast.success('Maintenance COMPLETED! Equipment returned to ACTIVE.');
      } else if (statusUpdateForm.status === 'IN_PROGRESS') {
        toast.success('Maintenance marked IN PROGRESS. Equipment is in MAINTENANCE.');
      } else {
        toast.success(`Maintenance status updated to ${statusUpdateForm.status}`);
      }

      closeModal();
      fetchRecords();
      // Refresh equipment list to reflect new status
      equipmentService.getEquipment({ size: 100 })
        .then(res => setEquipmentList(res.data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await maintenanceService.updateStatus(selected.id, { status: 'CANCELLED' });
      toast.success('Maintenance schedule cancelled. Equipment restored.');
      closeModal();
      fetchRecords();
      // Refresh equipment list
      equipmentService.getEquipment({ size: 100 })
        .then(res => setEquipmentList(res.data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel maintenance.');
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setEquipmentFilter('ALL');
    setBranchFilter(isSystemAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <FiTool style={{ color: 'var(--color-primary, #ff6b00)' }} /> Equipment Maintenance
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.9rem' }}>
            Schedule inspections, assign technicians, record machine problems, log repair details, and monitor fleet health
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchRecords} title="Refresh records">
            <FiRefreshCw /> Refresh
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiPlus /> Schedule Maintenance
            </button>
          )}
        </div>
      </div>

      {/* METRIC COUNTER CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid var(--color-primary, #ff6b00)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>TOTAL JOBS</span>
            <FiLayers style={{ color: 'var(--color-primary, #ff6b00)', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8 }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>All logged maintenance records</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>SCHEDULED</span>
            <FiCalendar style={{ color: '#f59e0b', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#f59e0b' }}>{stats.scheduled}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Pending inspection & service</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>IN PROGRESS</span>
            <FiTool style={{ color: '#3b82f6', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#3b82f6' }}>{stats.inProgress}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Technician currently servicing</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>COMPLETED</span>
            <FiCheckCircle style={{ color: '#22c55e', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#22c55e' }}>{stats.completed}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Repaired & returned to ACTIVE</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #6b7280' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>CANCELLED</span>
            <FiClock style={{ color: '#6b7280', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#9ca3af' }}>{stats.cancelled}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Cancelled or rescheduled jobs</div>
        </div>
      </div>

      {/* UPCOMING MAINTENANCE ALERT BANNER */}
      {upcomingAlerts.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '1.6rem' }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>
                Upcoming Maintenance Due ({upcomingAlerts.length} item{upcomingAlerts.length > 1 ? 's' : ''})
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', marginTop: 2 }}>
                Next due: <strong>{upcomingAlerts[0]?.equipmentName}</strong> on {upcomingAlerts[0]?.scheduledDate} ({upcomingAlerts[0]?.maintenanceType})
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', borderColor: '#f59e0b', color: '#f59e0b' }}
            onClick={() => setActiveTab('UPCOMING')}
          >
            View Upcoming Work
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
        <button
          className={`btn ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
          onClick={() => setActiveTab('ALL')}
        >
          All Records ({records.length})
        </button>
        <button
          className={`btn ${activeTab === 'UPCOMING' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
          onClick={() => setActiveTab('UPCOMING')}
        >
          Upcoming Work ({stats.scheduled + stats.inProgress})
        </button>
        <button
          className={`btn ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
          onClick={() => setActiveTab('HISTORY')}
        >
          Maintenance History ({stats.completed + stats.cancelled})
        </button>
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
              placeholder="Search equipment, problem, tech..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* STATUS FILTER */}
          <div>
            <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">📅 Scheduled</option>
              <option value="IN_PROGRESS">🔧 In Progress</option>
              <option value="COMPLETED">✅ Completed</option>
              <option value="CANCELLED">✕ Cancelled</option>
            </select>
          </div>

          {/* EQUIPMENT FILTER */}
          <div>
            <select className="form-input" value={equipmentFilter} onChange={e => setEquipmentFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Equipment</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.equipmentName} ({eq.serialNumber || `#${eq.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* BRANCH FILTER */}
          <div style={{ display: 'flex', gap: 8 }}>
            {isSystemAdmin ? (
              <select className="form-input" value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={{ flex: 1 }}>
                <option value="ALL">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branchName}</option>
                ))}
              </select>
            ) : (
              <select className="form-input" value={user?.branchId || ''} disabled style={{ flex: 1, cursor: 'not-allowed', color: '#94A3B8' }}>
                {branches.filter(b => b.id === user?.branchId).map(b => (
                  <option key={b.id} value={b.id}>{b.branchName}</option>
                ))}
                {branches.filter(b => b.id === user?.branchId).length === 0 && (
                  <option value={user?.branchId || ''}>{user?.branchName || 'My Branch'}</option>
                )}
              </select>
            )}
            {(search || statusFilter !== 'ALL' || equipmentFilter !== 'ALL' || (isSystemAdmin && branchFilter !== 'ALL')) && (
              <button className="btn btn-secondary" onClick={resetFilters} title="Reset filters">
                <FiX />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAINTENANCE DATA TABLE */}
      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>Loading maintenance operations...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID & Machine</th>
                  <th>Maintenance Type</th>
                  <th>Scheduled / Done</th>
                  <th>Problem / Scope</th>
                  <th>Technician</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tabFilteredRecords.map(m => {
                  const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.SCHEDULED;
                  const hasProblem = m.problem || m.description;
                  const isCompleted = m.status === 'COMPLETED';
                  const isCancelled = m.status === 'CANCELLED';

                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--color-primary, #ff6b00)', fontWeight: 700, fontSize: '0.85rem' }}>
                            #{m.id}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #ffffff)' }}>
                            {m.equipmentName || `Equipment #${m.equipmentId}`}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #9ca3af)', marginTop: 2 }}>
                          {m.equipmentSerialNumber ? `SN: ${m.equipmentSerialNumber}` : (m.equipmentModel || 'Standard')}
                          {m.branchName && ` · ${m.branchName}`}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {m.maintenanceType || 'Routine Service'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          📅 {m.scheduledDate || '—'}
                        </div>
                        {m.completedDate && (
                          <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 2 }}>
                            ✓ Done: {m.completedDate}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.83rem', maxWidth: 220, color: '#e5e7eb' }} title={hasProblem}>
                          {hasProblem ? (
                            <span>{hasProblem.length > 60 ? `${hasProblem.substring(0, 60)}...` : hasProblem}</span>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Routine check</span>
                          )}
                        </div>
                        {m.repairDetails && (
                          <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 2 }} title={m.repairDetails}>
                            🔧 Fix: {m.repairDetails.length > 50 ? `${m.repairDetails.substring(0, 50)}...` : m.repairDetails}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <FiUser style={{ color: '#ff6b00', fontSize: '0.8rem' }} />
                          <span>{m.assignedEmployeeName || m.performedBy || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {m.cost != null ? `Rs. ${parseFloat(m.cost).toFixed(2)}` : '—'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${cfg.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>{cfg.icon}</span> {cfg.label}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="View Full Details"
                            onClick={() => openDetails(m)}
                          >
                            <FiInfo /> Details
                          </button>

                          {isAdmin && !isCompleted && !isCancelled && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#22c55e' }}
                              title="Update Status / Record Repair Details"
                              onClick={() => openStatusUpdate(m)}
                            >
                              <FiActivity /> Update
                            </button>
                          )}

                          {isAdmin && !isCompleted && !isCancelled && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Edit Record"
                              onClick={() => openEdit(m)}
                            >
                              <FiEdit2 />
                            </button>
                          )}

                          {isAdmin && m.status === 'SCHEDULED' && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Cancel Schedule"
                              onClick={() => openCancel(m)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!tabFilteredRecords.length && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                        <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔧</div>
                        <h3 style={{ margin: '0 0 6px 0' }}>No maintenance records found</h3>
                        <p style={{ color: 'var(--color-text-secondary, #9ca3af)', marginBottom: 16 }}>
                          {activeTab === 'UPCOMING'
                            ? 'No upcoming maintenance scheduled at this time.'
                            : activeTab === 'HISTORY'
                            ? 'No completed maintenance history on file.'
                            : 'No maintenance records match your active search or filters.'}
                        </p>
                        {isAdmin && (
                          <button className="btn btn-primary" onClick={openCreate}>
                            <FiPlus /> Schedule Maintenance
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MAINTENANCE MODAL */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiPlus /> Schedule Equipment Maintenance
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#f59e0b' }}>
              ℹ️ <strong>Rule:</strong> Creating a maintenance job will automatically transition the machine's status to <strong>MAINTENANCE</strong>.
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Select Equipment Machine" required>
                    <select
                      className="form-input"
                      required
                      value={form.equipmentId}
                      onChange={e => setForm({ ...form, equipmentId: e.target.value })}
                    >
                      <option value="">-- Choose Machine --</option>
                      {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.equipmentName} ({eq.serialNumber || eq.model || `#${eq.id}`}) — Current: {eq.status}
                        </option>
                      ))}
                    </select>
                  </F>
                </div>

                <F label="Scheduled Date" required>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={form.scheduledDate}
                    onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  />
                </F>

                <F label="Maintenance Type" required>
                  <select
                    className="form-input"
                    required
                    value={form.maintenanceType}
                    onChange={e => setForm({ ...form, maintenanceType: e.target.value })}
                  >
                    {MAINTENANCE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </F>

                <F label="Assign Maintenance Employee">
                  <select
                    className="form-input"
                    value={form.assignedEmployeeId}
                    onChange={e => {
                      const empId = e.target.value;
                      const emp = employees.find(x => String(x.id) === empId);
                      setForm({
                        ...form,
                        assignedEmployeeId: empId,
                        performedBy: emp?.user?.fullName || emp?.fullName || form.performedBy
                      });
                    }}
                  >
                    <option value="">-- Select Active Staff / Tech --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.fullName || emp.fullName} ({emp.role?.replace(/_/g, ' ') || 'Staff'})
                      </option>
                    ))}
                  </select>
                </F>

                <F label="Technician Name (or External Vendor)">
                  <input
                    className="form-input"
                    placeholder="e.g. John Doe, SpeedQueen Care"
                    value={form.performedBy}
                    onChange={e => setForm({ ...form, performedBy: e.target.value })}
                  />
                </F>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Record Problem / Work Scope" required>
                    <textarea
                      className="form-input"
                      rows={3}
                      required
                      placeholder="Detail the issue, observed vibrations, error codes, or scheduled inspection steps..."
                      value={form.problem}
                      onChange={e => setForm({ ...form, problem: e.target.value, description: e.target.value })}
                    />
                  </F>
                </div>

                <F label="Estimated Cost (Rs.)">
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={form.cost}
                    onChange={e => setForm({ ...form, cost: e.target.value })}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Scheduling...' : 'Confirm & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS & RECORD REPAIR DETAILS MODAL */}
      {modal === 'status' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiActivity /> Update Maintenance #{selected.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
                {selected.equipmentName} ({selected.maintenanceType})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 2 }}>
                Current Status: <span className={`badge ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
              </div>
            </div>

            {statusUpdateForm.status === 'COMPLETED' && (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#22c55e' }}>
                ✅ <strong>Rule:</strong> Marking this job <strong>COMPLETED</strong> will automatically restore the equipment to <strong>ACTIVE</strong> and update its last maintenance timestamp.
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

            <form onSubmit={handleStatusSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <F label="Update Status To" required>
                  <select
                    className="form-input"
                    required
                    value={statusUpdateForm.status}
                    onChange={e => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                  >
                    {NEXT_STATUS_OPTIONS[selected.status]?.map(st => (
                      <option key={st} value={st}>{STATUS_CONFIG[st]?.icon} {STATUS_CONFIG[st]?.label || st}</option>
                    ))}
                  </select>
                </F>

                <F label="Record Repair Details & Actions Taken" required={statusUpdateForm.status === 'COMPLETED'}>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Describe what was repaired, cleaned, replaced (e.g. replaced motor belt, lubricated drum)..."
                    value={statusUpdateForm.repairDetails}
                    onChange={e => setStatusUpdateForm({ ...statusUpdateForm, repairDetails: e.target.value })}
                  />
                </F>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <F label="Final / Incurred Cost (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={statusUpdateForm.cost}
                      onChange={e => setStatusUpdateForm({ ...statusUpdateForm, cost: e.target.value })}
                    />
                  </F>

                  <F label="Completed Date">
                    <input
                      type="date"
                      className="form-input"
                      value={statusUpdateForm.completedDate}
                      onChange={e => setStatusUpdateForm({ ...statusUpdateForm, completedDate: e.target.value })}
                    />
                  </F>
                </div>

                <F label="Servicing Technician">
                  <input
                    className="form-input"
                    placeholder="Technician name"
                    value={statusUpdateForm.performedBy}
                    onChange={e => setStatusUpdateForm({ ...statusUpdateForm, performedBy: e.target.value })}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Updating...' : 'Save & Update Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {modal === 'details' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiInfo /> Maintenance Record #{selected.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Machine Banner */}
              <div style={{ background: 'rgba(255, 107, 0, 0.08)', border: '1px solid rgba(255, 107, 0, 0.2)', padding: 14, borderRadius: 6 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ff8c38' }}>
                  ⚙️ {selected.equipmentName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 4 }}>
                  Type: {selected.equipmentType || 'General'} · Model: {selected.equipmentModel || 'Standard'} · Serial: {selected.equipmentSerialNumber || 'N/A'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 2 }}>
                  Location: {selected.branchName || `Branch #${selected.branchId}`} · Machine Status: <strong>{selected.equipmentStatus}</strong>
                </div>
              </div>

              {/* Status & Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>JOB STATUS</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
                  </div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>MAINTENANCE TYPE</div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>{selected.maintenanceType}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>SCHEDULED DATE</div>
                  <div style={{ marginTop: 4 }}>{selected.scheduledDate || '—'}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>COMPLETED DATE</div>
                  <div style={{ marginTop: 4, color: selected.completedDate ? '#22c55e' : '#9ca3af' }}>
                    {selected.completedDate || 'Not yet completed'}
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>
                  REPORTED PROBLEM / WORK SCOPE
                </div>
                <div style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>
                  {selected.problem || selected.description || 'Routine scheduled inspection.'}
                </div>
              </div>

              {/* Repair Details */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>
                  REPAIR DETAILS & ACTIONS TAKEN
                </div>
                <div style={{ fontSize: '0.9rem', color: selected.repairDetails ? '#22c55e' : '#6b7280' }}>
                  {selected.repairDetails || 'No repair details logged yet.'}
                </div>
              </div>

              {/* Technician & Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ASSIGNED TECHNICIAN</div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>
                    {selected.assignedEmployeeName || selected.performedBy || 'Unassigned'}
                  </div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>MAINTENANCE COST</div>
                  <div style={{ marginTop: 4, fontWeight: 700, color: '#ff8c38' }}>
                    {selected.cost != null ? `Rs. ${parseFloat(selected.cost).toFixed(2)}` : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modal === 'edit' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiEdit2 /> Edit Maintenance #{selected.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Equipment Machine" required>
                    <select
                      className="form-input"
                      required
                      value={form.equipmentId}
                      onChange={e => setForm({ ...form, equipmentId: e.target.value })}
                    >
                      {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.equipmentName} ({eq.serialNumber || eq.model || `#${eq.id}`})
                        </option>
                      ))}
                    </select>
                  </F>
                </div>

                <F label="Scheduled Date" required>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={form.scheduledDate}
                    onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  />
                </F>

                <F label="Maintenance Type" required>
                  <select
                    className="form-input"
                    required
                    value={form.maintenanceType}
                    onChange={e => setForm({ ...form, maintenanceType: e.target.value })}
                  >
                    {MAINTENANCE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </F>

                <F label="Assign Maintenance Employee">
                  <select
                    className="form-input"
                    value={form.assignedEmployeeId}
                    onChange={e => {
                      const empId = e.target.value;
                      const emp = employees.find(x => String(x.id) === empId);
                      setForm({
                        ...form,
                        assignedEmployeeId: empId,
                        performedBy: emp?.user?.fullName || emp?.fullName || form.performedBy
                      });
                    }}
                  >
                    <option value="">-- Select Active Staff --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.fullName || emp.fullName}
                      </option>
                    ))}
                  </select>
                </F>

                <F label="Technician Name">
                  <input
                    className="form-input"
                    value={form.performedBy}
                    onChange={e => setForm({ ...form, performedBy: e.target.value })}
                  />
                </F>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Problem Description / Scope">
                    <textarea
                      className="form-input"
                      rows={3}
                      value={form.problem}
                      onChange={e => setForm({ ...form, problem: e.target.value, description: e.target.value })}
                    />
                  </F>
                </div>

                <F label="Estimated Cost (Rs.)">
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.cost}
                    onChange={e => setForm({ ...form, cost: e.target.value })}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {modal === 'cancel' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>✕ Cancel Maintenance Schedule</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <p style={{ color: 'var(--color-text-secondary, #9ca3af)', margin: '0 0 16px 0', fontSize: '0.9rem' }}>
              Are you sure you want to cancel the scheduled maintenance job for <strong>{selected.equipmentName}</strong>?
              If the machine was under maintenance, it will be restored to active service.
            </p>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={closeModal}>Back</button>
              <button className="btn btn-danger" disabled={saving} onClick={handleCancelSubmit}>
                {saving ? '⏳ Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
