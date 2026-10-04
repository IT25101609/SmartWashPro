import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import breakdownService from '../../services/breakdownService';
import equipmentService from '../../services/equipmentService';
import employeeService from '../../services/employeeService';
import branchService from '../../services/branchService';
import toast from 'react-hot-toast';
import {
  FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiClock,
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiUser, FiInfo,
  FiActivity, FiLayers, FiMapPin, FiDollarSign, FiX, FiRefreshCw,
  FiCheck, FiTool
} from 'react-icons/fi';

const STATUS_CONFIG = {
  REPORTED: { label: 'Reported', badge: 'badge-error', icon: '🚨', color: '#ef4444' },
  IN_PROGRESS: { label: 'In Progress', badge: 'badge-info', icon: '🔧', color: '#3b82f6' },
  IN_REPAIR: { label: 'In Progress', badge: 'badge-info', icon: '🔧', color: '#3b82f6' },
  REPAIRED: { label: 'Repaired', badge: 'badge-success', icon: '✅', color: '#22c55e' },
  CLOSED: { label: 'Closed', badge: 'badge-neutral', icon: '🔒', color: '#6b7280' },
  SCRAPPED: { label: 'Scrapped', badge: 'badge-neutral', icon: '🗑️', color: '#6b7280' }
};

const SEVERITY_CONFIG = {
  LOW: { label: 'Low', badge: 'badge-info', color: '#3b82f6' },
  MEDIUM: { label: 'Medium', badge: 'badge-warning', color: '#f59e0b' },
  HIGH: { label: 'High', badge: 'badge-error', color: '#f97316' },
  CRITICAL: { label: 'Critical', badge: 'badge-error', color: '#ef4444' }
};

const NEXT_STATUS_OPTIONS = {
  REPORTED: ['IN_PROGRESS', 'REPAIRED', 'CLOSED'],
  IN_PROGRESS: ['REPAIRED', 'CLOSED'],
  REPAIRED: ['CLOSED'],
  CLOSED: []
};

const EMPTY_FORM = {
  equipmentId: '',
  assignedEmployeeId: '',
  technician: '',
  reportedDate: new Date().toISOString().split('T')[0],
  severity: 'MEDIUM',
  problem: '',
  description: '',
  repairNotes: '',
  repairCost: ''
};

const F = ({ label, required, children }) => (
  <div className="form-group" style={{ marginBottom: 12 }}>
    <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 600 }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {children}
  </div>
);

export default function BreakdownsPage() {
  const { user } = useAuth();
  const isSystemAdmin = user?.role === 'ADMIN';
  const isAdmin = isSystemAdmin || user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER';

  // Data states
  const [breakdowns, setBreakdowns] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | ACTIVE | RESOLVED
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const initialBranchFilter = isSystemAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL');
  const [branchFilter, setBranchFilter] = useState(initialBranchFilter);

  useEffect(() => {
    if (!isSystemAdmin && user?.branchId) {
      setBranchFilter(String(user.branchId));
    }
  }, [isSystemAdmin, user]);

  // Modal states: null | 'create' | 'status' | 'details' | 'edit' | 'delete'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    repairNotes: '',
    repairCost: '',
    repairedDate: new Date().toISOString().split('T')[0],
    technician: ''
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

  // Fetch breakdowns
  const fetchBreakdowns = () => {
    setLoading(true);
    const params = { size: 100 };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (equipmentFilter !== 'ALL') params.equipmentId = equipmentFilter;
    const effBranch = !isSystemAdmin && user?.branchId ? user.branchId : (branchFilter !== 'ALL' ? branchFilter : undefined);
    if (effBranch) params.branchId = effBranch;

    breakdownService.getBreakdowns(params)
      .then(res => {
        let items = res.data?.content || [];
        if (severityFilter !== 'ALL') {
          items = items.filter(b => b.severity === severityFilter);
        }
        setBreakdowns(items);
      })
      .catch(err => {
        console.error('Failed to load breakdown records', err);
        toast.error('Failed to load breakdown records');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBreakdowns();
  }, [search, statusFilter, severityFilter, equipmentFilter, branchFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    let total = breakdowns.length;
    let reported = 0;
    let inProgress = 0;
    let repaired = 0;
    let closed = 0;

    breakdowns.forEach(b => {
      const s = b.status;
      if (s === 'REPORTED') reported++;
      else if (s === 'IN_PROGRESS' || s === 'IN_REPAIR') inProgress++;
      else if (s === 'REPAIRED') repaired++;
      else if (s === 'CLOSED' || s === 'SCRAPPED') closed++;
    });

    return { total, reported, inProgress, repaired, closed };
  }, [breakdowns]);

  // Tab filtering
  const tabFiltered = useMemo(() => {
    if (activeTab === 'ACTIVE') {
      return breakdowns.filter(b => b.status === 'REPORTED' || b.status === 'IN_PROGRESS' || b.status === 'IN_REPAIR');
    }
    if (activeTab === 'RESOLVED') {
      return breakdowns.filter(b => b.status === 'REPAIRED' || b.status === 'CLOSED');
    }
    return breakdowns;
  }, [breakdowns, activeTab]);

  // Active Outage Alerts (Reported or In Progress)
  const activeAlerts = useMemo(() => {
    return breakdowns.filter(b => b.status === 'REPORTED' || b.status === 'IN_PROGRESS');
  }, [breakdowns]);

  // Modal open handlers
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      equipmentId: equipmentList[0]?.id ? String(equipmentList[0].id) : '',
      reportedDate: new Date().toISOString().split('T')[0]
    });
    setError('');
    setModal('create');
  };

  const openStatusUpdate = (b) => {
    setSelected(b);
    const defaultNext = NEXT_STATUS_OPTIONS[b.status]?.[0] || 'REPAIRED';
    setStatusUpdateForm({
      status: defaultNext,
      repairNotes: b.repairNotes || '',
      repairCost: b.repairCost ? String(b.repairCost) : '',
      repairedDate: b.repairedDate || new Date().toISOString().split('T')[0],
      technician: b.technician || ''
    });
    setError('');
    setModal('status');
  };

  const openDetails = (b) => {
    setSelected(b);
    setModal('details');
  };

  const openEdit = (b) => {
    setSelected(b);
    setForm({
      equipmentId: b.equipmentId ? String(b.equipmentId) : '',
      assignedEmployeeId: b.assignedEmployeeId ? String(b.assignedEmployeeId) : '',
      technician: b.technician || '',
      reportedDate: b.reportedDate || '',
      severity: b.severity || 'MEDIUM',
      problem: b.problem || b.description || '',
      description: b.description || '',
      repairNotes: b.repairNotes || '',
      repairCost: b.repairCost ? String(b.repairCost) : ''
    });
    setError('');
    setModal('edit');
  };

  const openDelete = (b) => {
    setSelected(b);
    setError('');
    setModal('delete');
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
        technician: form.technician,
        reportedDate: form.reportedDate,
        severity: form.severity,
        priority: form.severity,
        problem: form.problem || form.description,
        description: form.description || form.problem,
        status: 'REPORTED'
      };

      await breakdownService.create(payload);
      toast.error('Breakdown reported! Equipment marked as BROKEN.');
      closeModal();
      fetchBreakdowns();
      // Refresh equipment list
      equipmentService.getEquipment({ size: 100 })
        .then(res => setEquipmentList(res.data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report breakdown.');
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
        technician: form.technician,
        reportedDate: form.reportedDate,
        severity: form.severity,
        problem: form.problem,
        description: form.description || form.problem,
        repairNotes: form.repairNotes,
        repairCost: form.repairCost ? parseFloat(form.repairCost) : null
      };

      await breakdownService.update(selected.id, payload);
      toast.success('Breakdown record updated successfully!');
      closeModal();
      fetchBreakdowns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update record.');
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
        repairNotes: statusUpdateForm.repairNotes,
        repairCost: statusUpdateForm.repairCost ? parseFloat(statusUpdateForm.repairCost) : null,
        repairedDate: (statusUpdateForm.status === 'REPAIRED' || statusUpdateForm.status === 'CLOSED')
          ? statusUpdateForm.repairedDate : null,
        technician: statusUpdateForm.technician
      };

      await breakdownService.updateStatus(selected.id, payload);

      if (statusUpdateForm.status === 'REPAIRED') {
        toast.success('Machine REPAIRED! Equipment restored to ACTIVE.');
      } else if (statusUpdateForm.status === 'CLOSED') {
        toast.success('Breakdown incident CLOSED! Machine is ACTIVE.');
      } else if (statusUpdateForm.status === 'IN_PROGRESS') {
        toast.success('Repair marked IN PROGRESS. Machine remains BROKEN.');
      } else {
        toast.success(`Breakdown status updated to ${statusUpdateForm.status}`);
      }

      closeModal();
      fetchBreakdowns();
      // Refresh equipment list
      equipmentService.getEquipment({ size: 100 })
        .then(res => setEquipmentList(res.data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseQuick = async (b) => {
    try {
      await breakdownService.close(b.id, {});
      toast.success('Breakdown ticket closed! Equipment remains ACTIVE.');
      fetchBreakdowns();
      equipmentService.getEquipment({ size: 100 })
        .then(res => setEquipmentList(res.data?.content || []));
    } catch {
      toast.error('Failed to close breakdown ticket.');
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await breakdownService.delete(selected.id);
      toast.success('Breakdown record deleted. Machine status refreshed.');
      closeModal();
      fetchBreakdowns();
      equipmentService.getEquipment({ size: 100 })
        .then(res => setEquipmentList(res.data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete breakdown record.');
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSeverityFilter('ALL');
    setEquipmentFilter('ALL');
    setBranchFilter(isSystemAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <FiAlertOctagon style={{ color: '#ef4444' }} /> Equipment Breakdowns
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.9rem' }}>
            Report machine failures, assign technicians, track repair diagnostics, log parts replaced, and close incident tickets
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchBreakdowns} title="Refresh records">
            <FiRefreshCw /> Refresh
          </button>
          {isAdmin && (
            <button className="btn btn-danger" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiPlus /> Report Breakdown
            </button>
          )}
        </div>
      </div>

      {/* METRIC COUNTER CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid var(--color-primary, #ff6b00)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>TOTAL INCIDENTS</span>
            <FiLayers style={{ color: 'var(--color-primary, #ff6b00)', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8 }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>All logged machine failures</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>REPORTED (DOWN)</span>
            <FiAlertTriangle style={{ color: '#ef4444', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#ef4444' }}>{stats.reported}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Machines offline awaiting tech</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>IN PROGRESS</span>
            <FiTool style={{ color: '#3b82f6', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#3b82f6' }}>{stats.inProgress}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Technician repairing machine</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>REPAIRED</span>
            <FiCheckCircle style={{ color: '#22c55e', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#22c55e' }}>{stats.repaired}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Restored to active service</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #6b7280' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: 600 }}>CLOSED</span>
            <FiClock style={{ color: '#6b7280', fontSize: '1.2rem' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 8, color: '#9ca3af' }}>{stats.closed}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6b7280)', marginTop: 4 }}>Resolved & tickets closed</div>
        </div>
      </div>

      {/* ACTIVE OUTAGE ALERT BANNER */}
      {activeAlerts.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '1.6rem' }}>🚨</div>
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>
                Active Machine Breakdowns ({activeAlerts.length} machine{activeAlerts.length > 1 ? 's' : ''} offline)
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9ca3af)', marginTop: 2 }}>
                Current outage: <strong>{activeAlerts[0]?.equipmentName}</strong> · Priority: <span style={{ color: '#ef4444', fontWeight: 600 }}>{activeAlerts[0]?.severity}</span> · {activeAlerts[0]?.problem || activeAlerts[0]?.description}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Review Active Outages
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
          All Incidents ({breakdowns.length})
        </button>
        <button
          className={`btn ${activeTab === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active Breakdowns ({stats.reported + stats.inProgress})
        </button>
        <button
          className={`btn ${activeTab === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
          onClick={() => setActiveTab('RESOLVED')}
        >
          Resolved & Closed ({stats.repaired + stats.closed})
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
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
              <option value="REPORTED">🚨 Reported</option>
              <option value="IN_PROGRESS">🔧 In Progress</option>
              <option value="REPAIRED">✅ Repaired</option>
              <option value="CLOSED">🔒 Closed</option>
            </select>
          </div>

          {/* SEVERITY / PRIORITY FILTER */}
          <div>
            <select className="form-input" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* EQUIPMENT FILTER */}
          <div>
            <select className="form-input" value={equipmentFilter} onChange={e => setEquipmentFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Machines</option>
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
            {(search || statusFilter !== 'ALL' || severityFilter !== 'ALL' || equipmentFilter !== 'ALL' || (isSystemAdmin && branchFilter !== 'ALL')) && (
              <button className="btn btn-secondary" onClick={resetFilters} title="Reset filters">
                <FiX />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BREAKDOWNS DATA TABLE */}
      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>Loading breakdown records...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket & Equipment</th>
                  <th>Priority</th>
                  <th>Reported Date</th>
                  <th>Problem Statement</th>
                  <th>Technician</th>
                  <th>Repair Summary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tabFiltered.map(b => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.REPORTED;
                  const sev = SEVERITY_CONFIG[b.severity] || SEVERITY_CONFIG.MEDIUM;
                  const problemText = b.problem || b.description || 'Unspecified failure';
                  const isRepaired = b.status === 'REPAIRED';
                  const isClosed = b.status === 'CLOSED';

                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                            #{b.id}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #ffffff)' }}>
                            {b.equipmentName || `Equipment #${b.equipmentId}`}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #9ca3af)', marginTop: 2 }}>
                          {b.equipmentSerialNumber ? `SN: ${b.equipmentSerialNumber}` : (b.equipmentModel || 'Standard')}
                          {b.branchName && ` · ${b.branchName}`}
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${sev.badge}`} style={{ fontSize: '0.78rem' }}>
                          {sev.label}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          📅 {b.reportedDate || '—'}
                        </div>
                        {b.repairedDate && (
                          <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 2 }}>
                            ✓ Repaired: {b.repairedDate}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.83rem', maxWidth: 220, color: '#e5e7eb' }} title={problemText}>
                          {problemText.length > 60 ? `${problemText.substring(0, 60)}...` : problemText}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <FiUser style={{ color: '#ff6b00', fontSize: '0.8rem' }} />
                          <span>{b.assignedEmployeeName || b.technician || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td>
                        {b.repairNotes ? (
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#22c55e' }} title={b.repairNotes}>
                              {b.repairNotes.length > 45 ? `${b.repairNotes.substring(0, 45)}...` : b.repairNotes}
                            </div>
                            {b.repairCost != null && (
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                Cost: Rs. {parseFloat(b.repairCost).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Pending repair</span>
                        )}
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
                            title="View Full Incident Details"
                            onClick={() => openDetails(b)}
                          >
                            <FiInfo /> Details
                          </button>

                          {isAdmin && !isClosed && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#22c55e' }}
                              title="Update Status / Record Repair"
                              onClick={() => openStatusUpdate(b)}
                            >
                              <FiActivity /> Update
                            </button>
                          )}

                          {isAdmin && isRepaired && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#9ca3af' }}
                              title="Close Incident Ticket"
                              onClick={() => handleCloseQuick(b)}
                            >
                              <FiCheck /> Close
                            </button>
                          )}

                          {isAdmin && !isClosed && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Edit Incident"
                              onClick={() => openEdit(b)}
                            >
                              <FiEdit2 />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Delete Record"
                              onClick={() => openDelete(b)}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!tabFiltered.length && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                        <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
                        <h3 style={{ margin: '0 0 6px 0' }}>No breakdown incidents found</h3>
                        <p style={{ color: 'var(--color-text-secondary, #9ca3af)', marginBottom: 16 }}>
                          {activeTab === 'ACTIVE'
                            ? 'All equipment is currently operating normally with zero active outages!'
                            : activeTab === 'RESOLVED'
                            ? 'No resolved breakdown history records on file.'
                            : 'No records match your active search filters.'}
                        </p>
                        {isAdmin && (
                          <button className="btn btn-danger" onClick={openCreate}>
                            <FiPlus /> Report Breakdown
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

      {/* REPORT BREAKDOWN MODAL */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
                <FiAlertOctagon /> Report Equipment Breakdown
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#ef4444' }}>
              ⚠️ <strong>Rule:</strong> Reporting a breakdown will immediately transition this machine's status to <strong>BROKEN</strong>.
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

                <F label="Priority / Severity" required>
                  <select
                    className="form-input"
                    required
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="LOW">Low (Minor noise, still operational)</option>
                    <option value="MEDIUM">Medium (Degraded performance / slow)</option>
                    <option value="HIGH">High (Cycle stops midway, leak)</option>
                    <option value="CRITICAL">Critical (Total stoppage, smoke, electrical)</option>
                  </select>
                </F>

                <F label="Incident Date" required>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={form.reportedDate}
                    onChange={e => setForm({ ...form, reportedDate: e.target.value })}
                  />
                </F>

                <F label="Assign Technician">
                  <select
                    className="form-input"
                    value={form.assignedEmployeeId}
                    onChange={e => {
                      const empId = e.target.value;
                      const emp = employees.find(x => String(x.id) === empId);
                      setForm({
                        ...form,
                        assignedEmployeeId: empId,
                        technician: emp?.user?.fullName || emp?.fullName || form.technician
                      });
                    }}
                  >
                    <option value="">-- Select Active Technician --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.fullName || emp.fullName} ({emp.role?.replace(/_/g, ' ') || 'Staff'})
                      </option>
                    ))}
                  </select>
                </F>

                <F label="Technician Name (or External Repairer)">
                  <input
                    className="form-input"
                    placeholder="e.g. John Silva, Appliance Pros"
                    value={form.technician}
                    onChange={e => setForm({ ...form, technician: e.target.value })}
                  />
                </F>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Describe Problem" required>
                    <textarea
                      className="form-input"
                      rows={4}
                      required
                      placeholder="Detail the failure, unusual sounds, error codes on display, or water/electrical issues..."
                      value={form.problem}
                      onChange={e => setForm({ ...form, problem: e.target.value, description: e.target.value })}
                    />
                  </F>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={saving}>
                  {saving ? '⏳ Submitting...' : 'Report Breakdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS & RECORD REPAIR MODAL */}
      {modal === 'status' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiActivity /> Update Breakdown Incident #{selected.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
                {selected.equipmentName} ({selected.severity} Priority)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 2 }}>
                Current Status: <span className={`badge ${STATUS_CONFIG[selected.status]?.badge}`}>{selected.status}</span>
              </div>
            </div>

            {statusUpdateForm.status === 'REPAIRED' && (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#22c55e' }}>
                ✅ <strong>Rule:</strong> Marking this breakdown <strong>REPAIRED</strong> will automatically restore the equipment status to <strong>ACTIVE</strong>.
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

                <F label="Record Repair Details & Parts Fixed" required={statusUpdateForm.status === 'REPAIRED'}>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Describe diagnostic findings, parts replaced (e.g. replaced motor belt, repaired seal, reset sensor)..."
                    value={statusUpdateForm.repairNotes}
                    onChange={e => setStatusUpdateForm({ ...statusUpdateForm, repairNotes: e.target.value })}
                  />
                </F>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <F label="Repair Cost (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={statusUpdateForm.repairCost}
                      onChange={e => setStatusUpdateForm({ ...statusUpdateForm, repairCost: e.target.value })}
                    />
                  </F>

                  <F label="Repaired Date">
                    <input
                      type="date"
                      className="form-input"
                      value={statusUpdateForm.repairedDate}
                      onChange={e => setStatusUpdateForm({ ...statusUpdateForm, repairedDate: e.target.value })}
                    />
                  </F>
                </div>

                <F label="Assigned / Repair Technician">
                  <input
                    className="form-input"
                    placeholder="Technician name"
                    value={statusUpdateForm.technician}
                    onChange={e => setStatusUpdateForm({ ...statusUpdateForm, technician: e.target.value })}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Updating...' : 'Save & Update Equipment'}
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
                <FiInfo /> Breakdown Incident #{selected.id}
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Machine Banner */}
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 14, borderRadius: 6 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ef4444' }}>
                  ⚙️ {selected.equipmentName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 4 }}>
                  Type: {selected.equipmentType || 'General'} · Model: {selected.equipmentModel || 'Standard'} · Serial: {selected.equipmentSerialNumber || 'N/A'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 2 }}>
                  Location: {selected.branchName || `Branch #${selected.branchId}`} · Machine Status: <strong>{selected.equipmentStatus}</strong>
                </div>
              </div>

              {/* Status & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>INCIDENT STATUS</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${STATUS_CONFIG[selected.status]?.badge}`}>{selected.status}</span>
                  </div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>PRIORITY / SEVERITY</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${SEVERITY_CONFIG[selected.severity]?.badge}`}>{selected.severity}</span>
                  </div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>REPORTED DATE</div>
                  <div style={{ marginTop: 4 }}>{selected.reportedDate || '—'}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>REPAIRED DATE</div>
                  <div style={{ marginTop: 4, color: selected.repairedDate ? '#22c55e' : '#9ca3af' }}>
                    {selected.repairedDate || 'Pending repair'}
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>
                  REPORTED PROBLEM STATEMENT
                </div>
                <div style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>
                  {selected.problem || selected.description}
                </div>
              </div>

              {/* Repair Notes */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>
                  RECORDED REPAIR & PART REPLACEMENT
                </div>
                <div style={{ fontSize: '0.9rem', color: selected.repairNotes ? '#22c55e' : '#6b7280' }}>
                  {selected.repairNotes || 'No repair notes recorded yet.'}
                </div>
              </div>

              {/* Technician & Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>TECHNICIAN</div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>
                    {selected.assignedEmployeeName || selected.technician || 'Unassigned'}
                  </div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>REPAIR COST</div>
                  <div style={{ marginTop: 4, fontWeight: 700, color: '#ff8c38' }}>
                    {selected.repairCost != null ? `Rs. ${parseFloat(selected.repairCost).toFixed(2)}` : '—'}
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
                <FiEdit2 /> Edit Breakdown Incident #{selected.id}
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

                <F label="Priority / Severity" required>
                  <select
                    className="form-input"
                    required
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </F>

                <F label="Reported Date" required>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={form.reportedDate}
                    onChange={e => setForm({ ...form, reportedDate: e.target.value })}
                  />
                </F>

                <F label="Assign Technician">
                  <select
                    className="form-input"
                    value={form.assignedEmployeeId}
                    onChange={e => {
                      const empId = e.target.value;
                      const emp = employees.find(x => String(x.id) === empId);
                      setForm({
                        ...form,
                        assignedEmployeeId: empId,
                        technician: emp?.user?.fullName || emp?.fullName || form.technician
                      });
                    }}
                  >
                    <option value="">-- Select Active Technician --</option>
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
                    value={form.technician}
                    onChange={e => setForm({ ...form, technician: e.target.value })}
                  />
                </F>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Problem Description" required>
                    <textarea
                      className="form-input"
                      rows={3}
                      required
                      value={form.problem}
                      onChange={e => setForm({ ...form, problem: e.target.value, description: e.target.value })}
                    />
                  </F>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Repair Notes / Actions">
                    <textarea
                      className="form-input"
                      rows={2}
                      value={form.repairNotes}
                      onChange={e => setForm({ ...form, repairNotes: e.target.value })}
                    />
                  </F>
                </div>

                <F label="Repair Cost (Rs.)">
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.repairCost}
                    onChange={e => setForm({ ...form, repairCost: e.target.value })}
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

      {/* DELETE MODAL */}
      {modal === 'delete' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>🗑️ Delete Incident Record</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX /></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <p style={{ color: 'var(--color-text-secondary, #9ca3af)', margin: '0 0 16px 0', fontSize: '0.9rem' }}>
              Are you sure you want to delete breakdown incident <strong>#{selected.id}</strong> for <strong>{selected.equipmentName}</strong>?
              If the machine was offline solely due to this incident, it will be restored to active service.
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
