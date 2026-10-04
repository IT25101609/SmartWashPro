import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLOR = {
  ACTIVE: 'badge-success',
  INACTIVE: 'badge-error',
  ON_LEAVE: 'badge-warning'
};

const ROLE_COLORS = {
  MANAGER: { bg: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' },
  BRANCH_MANAGER: { bg: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' },
  RECEPTIONIST: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  LAUNDRY_STAFF: { bg: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE', border: 'rgba(6, 182, 212, 0.3)' },
  DRIVER: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  DELIVERY_DRIVER: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  MAINTENANCE_STAFF: { bg: 'rgba(249, 115, 22, 0.15)', color: '#FB923C', border: 'rgba(249, 115, 22, 0.3)' },
  FINANCE_LEAD: { bg: 'rgba(234, 179, 8, 0.15)', color: '#FACC15', border: 'rgba(234, 179, 8, 0.3)' }
};

const ATTENDANCE_STATUS_COLORS = {
  PRESENT: 'badge-success',
  LATE: 'badge-warning',
  ABSENT: 'badge-error',
  LEAVE: 'badge-info'
};

const ROLES_LIST = [
  { value: 'MANAGER', label: 'Branch Manager' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'LAUNDRY_STAFF', label: 'Laundry Staff' },
  { value: 'DRIVER', label: 'Delivery Driver' },
  { value: 'MAINTENANCE_STAFF', label: 'Maintenance Staff' }
];

const F = ({ label, children }) => (
  <div className="form-group" style={{ marginBottom: 12 }}>
    <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: 4, display: 'block', color: 'var(--color-text-secondary)' }}>{label}</label>
    {children}
  </div>
);

export default function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'staff';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isBranchManager = user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER';
  const isStaffManager = isBranchManager || isAdmin;

  // Staff List & Filter State
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const initialBranch = isAdmin ? 'ALL' : (user?.branchId ? String(user.branchId) : 'ALL');
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    if (!isAdmin && user?.branchId) {
      setSelectedBranch(String(user.branchId));
    }
  }, [isAdmin, user]);

  // Modals State
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'details' | 'assignBranch' | 'deactivate'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    role: 'LAUNDRY_STAFF',
    branchId: '',
    password: 'password123',
    hireDate: ''
  });
  const [assignBranchId, setAssignBranchId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Details Modal Sub-tabs: 'info' | 'tasks' | 'attendance'
  const [detailsTab, setDetailsTab] = useState('info');
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [employeeAttendance, setEmployeeAttendance] = useState([]);
  const [empAttLoading, setEmpAttLoading] = useState(false);

  // Attendance Tab State
  const [attendances, setAttendances] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attSearch, setAttSearch] = useState('');
  const [attDate, setAttDate] = useState('');
  const [attEmployeeId, setAttEmployeeId] = useState('');
  const [attStatus, setAttStatus] = useState('ALL');
  const [attForm, setAttForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    checkIn: '08:00',
    checkOut: '17:00',
    attendanceStatus: 'PRESENT'
  });

  // Load branches
  useEffect(() => {
    api.get('/branches')
      .then(res => setBranches(res.data || []))
      .catch(() => {});
  }, []);

  // Load employees
  const loadEmployees = () => {
    setLoading(true);
    const params = { size: 100 };
    if (search.trim()) params.search = search.trim();
    if (selectedRole !== 'ALL') params.role = selectedRole;
    const effBranch = !isAdmin && user?.branchId ? user.branchId : (selectedBranch !== 'ALL' ? selectedBranch : undefined);
    if (effBranch) params.branchId = effBranch;
    if (selectedStatus !== 'ALL') params.status = selectedStatus;

    api.get('/employees', { params })
      .then(res => setEmployees(res.data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Load attendance
  const loadAttendance = () => {
    setAttLoading(true);
    const params = { size: 100 };
    if (attSearch.trim()) params.search = attSearch.trim();
    if (attDate) params.date = attDate;
    if (attEmployeeId) params.employeeId = attEmployeeId;
    if (attStatus !== 'ALL') params.status = attStatus;

    api.get('/attendance', { params })
      .then(res => setAttendances(res.data.content || []))
      .catch(() => {})
      .finally(() => setAttLoading(false));
  };

  useEffect(() => {
    loadEmployees();
  }, [search, selectedRole, selectedBranch, selectedStatus]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendance();
    }
  }, [activeTab, attSearch, attDate, attEmployeeId, attStatus]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams(tabName === 'staff' ? {} : { tab: tabName });
  };

  // Modal openers
  const openCreate = () => {
    const defaultBranch = branches.length > 0 ? branches[0].id : '';
    setForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      role: 'LAUNDRY_STAFF',
      branchId: user?.branchId || defaultBranch,
      password: 'password123',
      hireDate: new Date().toISOString().split('T')[0]
    });
    setError('');
    setModal('create');
  };

  const openEdit = (emp) => {
    setSelected(emp);
    setForm({
      fullName: emp.fullName || '',
      email: emp.email || '',
      phoneNumber: emp.phoneNumber || '',
      address: emp.address || '',
      role: emp.role || 'LAUNDRY_STAFF',
      branchId: emp.branchId || '',
      password: '',
      hireDate: emp.hireDate || ''
    });
    setError('');
    setModal('edit');
  };

  const openAssignBranch = (emp) => {
    setSelected(emp);
    setAssignBranchId(emp.branchId || '');
    setError('');
    setModal('assignBranch');
  };

  const openDetails = (emp) => {
    setSelected(emp);
    setDetailsTab('info');
    setError('');
    setModal('details');

    // Fetch tasks & attendance
    setTasksLoading(true);
    api.get(`/employees/${emp.id}/tasks`)
      .then(res => setEmployeeTasks(res.data.content || []))
      .catch(() => setEmployeeTasks([]))
      .finally(() => setTasksLoading(false));

    setEmpAttLoading(true);
    api.get(`/employees/${emp.id}/attendance`)
      .then(res => setEmployeeAttendance(res.data.content || []))
      .catch(() => setEmployeeAttendance([]))
      .finally(() => setEmpAttLoading(false));
  };

  const openDeactivate = (emp) => {
    setSelected(emp);
    setError('');
    setModal('deactivate');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
  };

  // Form Submissions
  const handleCreate = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/employees', {
        ...form,
        branchId: form.branchId ? Number(form.branchId) : undefined
      });
      closeModal();
      loadEmployees();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/employees/${selected.id}`, {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        address: form.address,
        role: form.role,
        branchId: form.branchId ? Number(form.branchId) : undefined,
        hireDate: form.hireDate || undefined
      });
      closeModal();
      loadEmployees();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignBranchSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/employees/${selected.id}/branch`, {
        branchId: assignBranchId ? Number(assignBranchId) : null
      });
      closeModal();
      loadEmployees();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign branch');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    try {
      await api.put(`/employees/${emp.id}/toggle-status`);
      loadEmployees();
    } catch (e) {
      alert(e.response?.data?.message || 'Status toggle failed');
    }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/employees/${selected.id}/deactivate`);
      closeModal();
      loadEmployees();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to deactivate employee');
    } finally {
      setSaving(false);
    }
  };

  // Quick Attendance view transition
  const viewEmployeeAttendance = (empId) => {
    setAttEmployeeId(String(empId));
    setAttDate('');
    handleTabChange('attendance');
  };

  // Attendance Handlers
  const openCheckIn = (emp = null) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);
    setAttForm({
      employeeId: emp ? emp.id : (employees.find(e => e.employmentStatus === 'ACTIVE')?.id || ''),
      date: today,
      time: nowTime
    });
    setError('');
    setModal('checkIn');
  };

  const openCheckOut = (attOrEmp = null) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);
    let targetEmpId = '';
    if (attOrEmp?.employeeId) {
      targetEmpId = attOrEmp.employeeId;
    } else if (attOrEmp?.id) {
      targetEmpId = attOrEmp.id;
    } else {
      targetEmpId = employees.find(e => e.employmentStatus === 'ACTIVE')?.id || '';
    }

    setAttForm({
      employeeId: targetEmpId,
      date: attOrEmp?.date || today,
      time: nowTime
    });
    setError('');
    setModal('checkOut');
  };

  const openRecordAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    setAttForm({
      employeeId: employees.find(e => e.employmentStatus === 'ACTIVE')?.id || '',
      date: today,
      checkIn: '08:00',
      checkOut: '17:00',
      attendanceStatus: 'PRESENT'
    });
    setError('');
    setModal('recordAttendance');
  };

  const handleCheckInSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/attendance/check-in', {
        employeeId: Number(attForm.employeeId),
        date: attForm.date,
        time: attForm.time ? (attForm.time.length === 5 ? attForm.time + ':00' : attForm.time) : undefined
      });
      closeModal();
      loadAttendance();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-in failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOutSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/attendance/check-out', {
        employeeId: Number(attForm.employeeId),
        date: attForm.date,
        time: attForm.time ? (attForm.time.length === 5 ? attForm.time + ':00' : attForm.time) : undefined
      });
      closeModal();
      loadAttendance();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-out failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordAttendanceSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/attendance', {
        employeeId: Number(attForm.employeeId),
        date: attForm.date,
        checkIn: attForm.checkIn ? (attForm.checkIn.length === 5 ? attForm.checkIn + ':00' : attForm.checkIn) : undefined,
        checkOut: attForm.checkOut ? (attForm.checkOut.length === 5 ? attForm.checkOut + ':00' : attForm.checkOut) : undefined,
        attendanceStatus: attForm.attendanceStatus
      });
      closeModal();
      loadAttendance();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await api.delete(`/attendance/${id}`);
      loadAttendance();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete attendance record');
    }
  };

  // Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.employmentStatus === 'ACTIVE').length;
  const inactiveEmployees = employees.filter(e => e.employmentStatus === 'INACTIVE').length;
  const uniqueBranchesCount = new Set(employees.map(e => e.branchId).filter(Boolean)).size;

  // Attendance metrics
  const countPresent = attendances.filter(a => a.attendanceStatus === 'PRESENT').length;
  const countLate = attendances.filter(a => a.attendanceStatus === 'LATE').length;
  const countAbsent = attendances.filter(a => a.attendanceStatus === 'ABSENT').length;
  const countLeave = attendances.filter(a => a.attendanceStatus === 'LEAVE').length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.75rem', fontWeight: 800 }}>
            <span>👷</span> Employee Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Comprehensive staff roster, branch assignments, operational task status, and real-time attendance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeTab === 'staff' && isStaffManager && (
            <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>➕</span> Add Employee
            </button>
          )}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => openCheckIn()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.86rem' }}
              >
                <span>🟢</span> Check In
              </button>
              <button
                className="btn btn-outline"
                onClick={() => openCheckOut()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.86rem', borderColor: 'rgba(239,68,68,0.4)', color: '#F87171' }}
              >
                <span>⏹️</span> Check Out
              </button>
              {isStaffManager && (
                <button
                  className="btn btn-secondary"
                  onClick={openRecordAttendance}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.86rem' }}
                >
                  <span>📝</span> Record Attendance
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* METRICS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #FF6B00' }}>
          <div style={{ fontSize: '0.82rem', color: '#A0A0B0', fontWeight: 600 }}>TOTAL ROSTER</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{totalEmployees}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>Staff across all departments</div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #22C55E' }}>
          <div style={{ fontSize: '0.82rem', color: '#A0A0B0', fontWeight: 600 }}>ACTIVE STAFF</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#22C55E', marginTop: '4px' }}>{activeEmployees}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>Eligible for task assignment</div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.82rem', color: '#A0A0B0', fontWeight: 600 }}>INACTIVE / ON-HOLD</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>{inactiveEmployees}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>Tasks blocked from assignment</div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.82rem', color: '#A0A0B0', fontWeight: 600 }}>BRANCHES SERVICED</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#3B82F6', marginTop: '4px' }}>{uniqueBranchesCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>Active location branches</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem'
      }}>
        <button
          className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleTabChange('staff')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 18px', fontWeight: 600 }}
        >
          👷 Staff Directory ({employees.length})
        </button>
        <button
          className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleTabChange('attendance')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 18px', fontWeight: 600 }}
        >
          📋 Attendance Logs ({attendances.length})
        </button>
      </div>

      {/* ================= TAB 1: STAFF DIRECTORY ================= */}
      {activeTab === 'staff' && (
        <>
          {/* SEARCH & FILTERS BAR */}
          <div className="card-glass" style={{
            padding: '1.2rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', flex: 1 }}>
              {/* Search */}
              <div style={{ minWidth: 260, flex: 1 }}>
                <input
                  className="form-input"
                  placeholder="🔍 Search name, email, phone number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Role Filter */}
              <div>
                <select
                  className="form-input"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  style={{ padding: '8px 12px', minWidth: 170 }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="MANAGER">Branch Manager</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="LAUNDRY_STAFF">Laundry Staff</option>
                  <option value="DRIVER">Delivery Driver</option>
                  <option value="MAINTENANCE_STAFF">Maintenance Staff</option>
                  <option value="FINANCE_LEAD">Finance Lead</option>
                </select>
              </div>

              {/* Branch Filter */}
              <div>
                {isAdmin ? (
                  <select
                    className="form-input"
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    style={{ padding: '8px 12px', minWidth: 180 }}
                  >
                    <option value="ALL">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.branchName} ({b.branchCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="form-input"
                    value={user?.branchId || ''}
                    disabled
                    style={{ padding: '8px 12px', minWidth: 180, cursor: 'not-allowed', color: '#94A3B8' }}
                  >
                    {branches.filter(b => b.id === user?.branchId).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.branchName} ({b.branchCode})
                      </option>
                    ))}
                    {branches.filter(b => b.id === user?.branchId).length === 0 && (
                      <option value={user?.branchId || ''}>{user?.branchName || 'My Branch'}</option>
                    )}
                  </select>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <select
                  className="form-input"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ padding: '8px 12px', minWidth: 130 }}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {(search || selectedRole !== 'ALL' || (isAdmin && selectedBranch !== 'ALL') || selectedStatus !== 'ALL') && (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSearch('');
                    setSelectedRole('ALL');
                    if (isAdmin) setSelectedBranch('ALL');
                    setSelectedStatus('ALL');
                  }}
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  Reset
                </button>
              )}
            </div>

            <button
              className="btn btn-outline"
              onClick={loadEmployees}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              🔄 Refresh List
            </button>
          </div>

          {/* EMPLOYEES TABLE */}
          {loading ? (
            <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Contact</th>
                      <th>Role</th>
                      <th>Assigned Branch</th>
                      <th>Status</th>
                      <th>Hire Date</th>
                      <th>Tasks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(e => {
                      const isTargetBranchManager = e.role === 'BRANCH_MANAGER' || e.role === 'MANAGER' || e.role === 'BRANCH_MANAGER_ADMIN';
                      const roleStyle = ROLE_COLORS[e.role] || { bg: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: 'transparent' };

                      return (
                        <tr key={e.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: roleStyle.bg,
                                color: roleStyle.color,
                                border: `1px solid ${roleStyle.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}>
                                {e.fullName?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{e.fullName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: #{e.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{e.email}</div>
                            {e.phoneNumber && (
                              <a href={`tel:${e.phoneNumber}`} style={{ fontSize: '0.78rem', color: '#FF6B00', textDecoration: 'none' }}>
                                📞 {e.phoneNumber}
                              </a>
                            )}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: roleStyle.bg,
                              color: roleStyle.color,
                              border: `1px solid ${roleStyle.border}`
                            }}>
                              {e.role?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            {e.branchName ? (
                              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                🏢 {e.branchName}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${STATUS_COLOR[e.employmentStatus] || 'badge-neutral'}`}>
                              {e.employmentStatus}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{e.hireDate || '—'}</td>
                          <td>
                            <span style={{
                              background: e.assignedTasksCount > 0 ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                              color: e.assignedTasksCount > 0 ? '#FF6B00' : 'var(--color-text-muted)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 700,
                              fontSize: '0.75rem'
                            }}>
                              {e.assignedTasksCount || 0} tasks
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {/* Details button */}
                              <button
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => openDetails(e)}
                                title="View Details, Tasks & Attendance"
                              >
                                👁️ View
                              </button>

                              {/* Edit Button */}
                              {isStaffManager && (!isTargetBranchManager || isAdmin) && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  onClick={() => openEdit(e)}
                                  title="Edit Employee"
                                >
                                  ✏️ Edit
                                </button>
                              )}

                              {/* Assign Branch Button */}
                              {isAdmin && (
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'rgba(59,130,246,0.3)', color: '#60A5FA' }}
                                  onClick={() => openAssignBranch(e)}
                                  title="Assign Branch"
                                >
                                  🏢 Branch
                                </button>
                              )}

                              {/* Status Toggle Button */}
                              {isStaffManager && (!isTargetBranchManager || isAdmin) && (
                                e.employmentStatus === 'ACTIVE' ? (
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    onClick={() => openDeactivate(e)}
                                    title="Deactivate Employee"
                                  >
                                    🚫 Deactivate
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-outline"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'rgba(34,197,94,0.4)', color: '#4ADE80' }}
                                    onClick={() => handleToggleStatus(e)}
                                    title="Activate Employee"
                                  >
                                    ⚡ Activate
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!employees.length && (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                            <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>👷</div>
                            <h3 style={{ marginTop: '0.5rem' }}>No employees found</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                              Try adjusting your search criteria or add a new team member.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: ATTENDANCE TRACKING ================= */}
      {activeTab === 'attendance' && (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '1.25rem',
            color: '#86EFAC',
            fontSize: '0.88rem'
          }}>
            <span style={{ fontSize: '1.3rem' }}>⚡</span>
            <div>
              <strong>Live Automated Attendance:</strong> Employee attendance and check-in timestamps are automatically captured and updated by the system based on operational shifts and staff schedules.
            </div>
          </div>

          {/* Attendance Stat Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #22C55E' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>🟢 PRESENT</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{countPresent}</div>
            </div>
            <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #EAB308' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>🟡 LATE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{countLate}</div>
            </div>
            <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>🔴 ABSENT</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{countAbsent}</div>
            </div>
            <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>🟣 LEAVE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{countLeave}</div>
            </div>
          </div>

          {/* Attendance Filters Bar */}
          <div className="card-glass" style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'block', marginBottom: '2px' }}>Search Staff</label>
                <input
                  className="form-input"
                  placeholder="🔍 Search name, email, phone..."
                  value={attSearch}
                  onChange={e => setAttSearch(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem', minWidth: '190px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'block', marginBottom: '2px' }}>Filter Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={attDate}
                  onChange={e => setAttDate(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'block', marginBottom: '2px' }}>Staff Member</label>
                <select
                  className="form-input"
                  value={attEmployeeId}
                  onChange={e => setAttEmployeeId(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem', minWidth: '180px' }}
                >
                  <option value="">All Staff Members</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.role?.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'block', marginBottom: '2px' }}>Status</label>
                <select
                  className="form-input"
                  value={attStatus}
                  onChange={e => setAttStatus(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>

              {(attSearch || attDate || attEmployeeId || attStatus !== 'ALL') && (
                <button
                  className="btn btn-outline"
                  onClick={() => { setAttSearch(''); setAttDate(''); setAttEmployeeId(''); setAttStatus('ALL'); }}
                  style={{ alignSelf: 'flex-end', padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <button
              className="btn btn-outline"
              onClick={loadAttendance}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              🔄 Refresh Attendance Log
            </button>
          </div>

          {/* Attendance Table */}
          {attLoading ? (
            <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Attendance ID</th>
                      <th>Staff Member</th>
                      <th>Branch</th>
                      <th>Date</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 700, color: '#FF6B00' }}>#{a.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: 'rgba(255,107,0,0.15)',
                              color: '#FF6B00',
                              border: '1px solid rgba(255,107,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.78rem'
                            }}>
                              {a.employeeName?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.employeeName}</div>
                              {a.employeeRole && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  {a.employeeRole.replace(/_/g, ' ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: a.branchName ? 'inherit' : 'var(--color-text-muted)' }}>
                            {a.branchName ? `🏢 ${a.branchName}` : '—'}
                          </span>
                        </td>
                        <td>{a.date || '—'}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: a.checkIn ? '#22C55E' : '#A0A0B0' }}>
                            {a.checkIn || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: a.checkOut ? '#FFFFFF' : '#A0A0B0' }}>
                            {a.checkOut || '—'}
                          </span>
                        </td>
                        <td>
                          {a.workingHoursFormatted === 'In Progress' ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              ⏳ In Progress
                            </span>
                          ) : a.workingHoursFormatted && a.workingHoursFormatted !== '—' ? (
                            <span style={{ fontWeight: 700, color: '#4ADE80', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ⏱️ {a.workingHoursFormatted}
                              {a.workingHours != null && (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', fontWeight: 500 }}>
                                  ({a.workingHours}h)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${ATTENDANCE_STATUS_COLORS[a.attendanceStatus] || 'badge-neutral'}`}>
                            {a.attendanceStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {a.checkIn && !a.checkOut && (
                              <button
                                className="btn btn-outline"
                                style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.4)', color: '#F87171' }}
                                onClick={() => openCheckOut(a)}
                                title="Check Out Staff Member"
                              >
                                ⏹️ Check Out
                              </button>
                            )}
                            {isStaffManager && (
                              <button
                                className="btn btn-icon"
                                style={{ padding: '4px', fontSize: '0.8rem', color: '#EF4444' }}
                                onClick={() => handleDeleteAttendance(a.id)}
                                title="Delete Attendance Record"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!attendances.length && (
                      <tr>
                        <td colSpan={9}>
                          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                            <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>📋</div>
                            <h3 style={{ marginTop: '0.5rem' }}>No attendance records found</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                              Check in a staff member or record attendance to start tracking shifts.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. ADD EMPLOYEE MODAL */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Add New Employee</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <F label="Full Name *">
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. Ruwan Jayasinghe"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                  />
                </F>
                <F label="Email Address *">
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="e.g. ruwan@smartwash.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </F>
                <F label="Phone Number *">
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. 0771234567"
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </F>
                <F label="Role *">
                  <select
                    className="form-input"
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES_LIST.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </F>
                <F label="Assigned Branch *">
                  <select
                    className="form-input"
                    required
                    value={form.branchId}
                    onChange={e => setForm({ ...form, branchId: e.target.value })}
                    disabled={!isAdmin && isBranchManager}
                  >
                    {!isAdmin ? (
                      branches.filter(b => b.id === user?.branchId).map(b => (
                        <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode})</option>
                      ))
                    ) : (
                      <>
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode})</option>
                        ))}
                      </>
                    )}
                  </select>
                </F>
                <F label="Hire Date">
                  <input
                    type="date"
                    className="form-input"
                    value={form.hireDate}
                    onChange={e => setForm({ ...form, hireDate: e.target.value })}
                  />
                </F>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Residential Address">
                    <input
                      className="form-input"
                      placeholder="e.g. 123 Galle Road, Colombo"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </F>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Default Password">
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Defaults to password123"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                  </F>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saving...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT EMPLOYEE MODAL */}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ Edit Employee — {selected?.fullName}</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <F label="Full Name *">
                  <input
                    className="form-input"
                    required
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                  />
                </F>
                <F label="Email (Read-only)">
                  <input
                    className="form-input"
                    disabled
                    value={form.email}
                    style={{ opacity: 0.7 }}
                  />
                </F>
                <F label="Phone Number *">
                  <input
                    className="form-input"
                    required
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </F>
                <F label="Role">
                  <select
                    className="form-input"
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES_LIST.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </F>
                {isAdmin && (
                  <F label="Assigned Branch">
                    <select
                      className="form-input"
                      value={form.branchId}
                      onChange={e => setForm({ ...form, branchId: e.target.value })}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode})</option>
                      ))}
                    </select>
                  </F>
                )}
                <F label="Hire Date">
                  <input
                    type="date"
                    className="form-input"
                    value={form.hireDate}
                    onChange={e => setForm({ ...form, hireDate: e.target.value })}
                  />
                </F>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Residential Address">
                    <input
                      className="form-input"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </F>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN BRANCH MODAL */}
      {modal === 'assignBranch' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🏢 Assign Branch — {selected?.fullName}</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleAssignBranchSubmit}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
                Select the target branch for <strong>{selected?.fullName}</strong>. Their operational tasks and records will be linked to this location.
              </p>
              <F label="Target Branch *">
                <select
                  className="form-input"
                  required
                  value={assignBranchId}
                  onChange={e => setAssignBranchId(e.target.value)}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode})</option>
                  ))}
                </select>
              </F>
              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Updating...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. VIEW DETAILS MODAL (WITH TASKS & ATTENDANCE SUB-TABS) */}
      {modal === 'details' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 780, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,107,0,0.15)',
                  color: '#FF6B00',
                  border: '1px solid rgba(255,107,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}>
                  {selected.fullName?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>{selected.fullName}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Staff ID #{selected.id} • {selected.role?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {/* Quick Stat Chips */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              margin: '1rem 0'
            }}>
              <div className="card-glass" style={{ padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#A0A0B0' }}>ASSIGNED TASKS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF6B00', marginTop: 2 }}>
                  {selected.assignedTasksCount || employeeTasks.length}
                </div>
              </div>
              <div className="card-glass" style={{ padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#A0A0B0' }}>STATUS</div>
                <div style={{ marginTop: 4 }}>
                  <span className={`badge ${STATUS_COLOR[selected.employmentStatus] || 'badge-neutral'}`}>
                    {selected.employmentStatus}
                  </span>
                </div>
              </div>
              <div className="card-glass" style={{ padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#A0A0B0' }}>BRANCH</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                  {selected.branchName || 'Unassigned'}
                </div>
              </div>
            </div>

            {/* Details Modal Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}>
              <button
                className={`btn ${detailsTab === 'info' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                onClick={() => setDetailsTab('info')}
              >
                👤 Profile Info
              </button>
              <button
                className={`btn ${detailsTab === 'tasks' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                onClick={() => setDetailsTab('tasks')}
              >
                💼 Assigned Tasks ({employeeTasks.length})
              </button>
              <button
                className={`btn ${detailsTab === 'attendance' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                onClick={() => setDetailsTab('attendance')}
              >
                📅 Attendance Log ({employeeAttendance.length})
              </button>
            </div>

            {/* Tab Content 1: Profile Info */}
            {detailsTab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.5rem 0' }}>
                <div className="card-glass" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Email Address</div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>{selected.email}</div>
                </div>
                <div className="card-glass" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Phone Number</div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>{selected.phoneNumber || 'Not provided'}</div>
                </div>
                <div className="card-glass" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Branch Code</div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>{selected.branchCode || '—'}</div>
                </div>
                <div className="card-glass" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Hire Date</div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>{selected.hireDate || '—'}</div>
                </div>
                <div className="card-glass" style={{ padding: '1rem', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Residential Address</div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>{selected.address || 'Not provided'}</div>
                </div>
              </div>
            )}

            {/* Tab Content 2: Assigned Tasks */}
            {detailsTab === 'tasks' && (
              <div>
                {tasksLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
                ) : employeeTasks.length > 0 ? (
                  <div className="table-container">
                    <table className="table" style={{ fontSize: '0.84rem' }}>
                      <thead>
                        <tr>
                          <th>Task ID</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeTasks.map(t => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 700, color: '#FF6B00' }}>#{t.id}</td>
                            <td><span className="badge badge-info">{t.taskType}</span></td>
                            <td>{t.taskDescription}</td>
                            <td>
                              <span className={`badge ${t.priority === 'HIGH' || t.priority === 'URGENT' ? 'badge-error' : 'badge-neutral'}`}>
                                {t.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${t.taskStatus === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                                {t.taskStatus}
                              </span>
                            </td>
                            <td>{t.dueDate ? t.dueDate.split('T')[0] : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No tasks currently assigned to this employee.
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 3: Attendance History */}
            {detailsTab === 'attendance' && (
              <div>
                {empAttLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
                ) : employeeAttendance.length > 0 ? (
                  <div className="table-container">
                    <table className="table" style={{ fontSize: '0.84rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Working Hours</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeAttendance.map(a => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 600 }}>{a.date}</td>
                            <td style={{ color: a.checkIn ? '#22C55E' : 'inherit' }}>{a.checkIn || '—'}</td>
                            <td>{a.checkOut || '—'}</td>
                            <td>
                              <span style={{ fontWeight: 600, color: a.workingHoursFormatted === 'In Progress' ? '#FB923C' : '#4ADE80' }}>
                                {a.workingHoursFormatted || '—'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${ATTENDANCE_STATUS_COLORS[a.attendanceStatus] || 'badge-neutral'}`}>
                                {a.attendanceStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No attendance logs recorded for this employee.
                  </div>
                )}
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DEACTIVATE CONFIRM MODAL */}
      {modal === 'deactivate' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚫 Deactivate Employee</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div style={{ padding: '0 4px 16px' }}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                Are you sure you want to deactivate <strong>{selected?.fullName}</strong>?
              </p>
              <div className="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: '0.85rem' }}>
                ⚠️ <strong>Task Enforcement:</strong> Once deactivated, this employee will be blocked from receiving any new operational tasks, pickup assignments, or delivery duties.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" disabled={saving} onClick={handleDeactivate}>
                {saving ? '⏳ Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CHECK-IN MODAL */}
      {modal === 'checkIn' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🟢 Employee Shift Check-In</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCheckInSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <F label="Select Staff Member *">
                  <select
                    className="form-input"
                    required
                    value={attForm.employeeId}
                    onChange={e => setAttForm({ ...attForm, employeeId: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.filter(e => e.employmentStatus === 'ACTIVE').map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.role?.replace(/_/g, ' ')}) — Branch: {emp.branchName || 'Main'}
                      </option>
                    ))}
                  </select>
                </F>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <F label="Shift Date *">
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={attForm.date}
                      onChange={e => setAttForm({ ...attForm, date: e.target.value })}
                    />
                  </F>
                  <F label="Check-In Time *">
                    <input
                      type="time"
                      className="form-input"
                      required
                      value={attForm.time}
                      onChange={e => setAttForm({ ...attForm, time: e.target.value })}
                    />
                  </F>
                </div>

                <div className="alert" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 8, padding: '10px 14px', color: '#86EFAC', fontSize: '0.82rem' }}>
                  ℹ️ <strong>Shift Rule:</strong> Staff cannot check in twice on the same shift date. Arrival after 08:30 will automatically be categorized as <strong>LATE</strong>.
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Checking In...' : 'Confirm Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CHECK-OUT MODAL */}
      {modal === 'checkOut' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⏹️ Employee Shift Check-Out</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCheckOutSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <F label="Select Staff Member *">
                  <select
                    className="form-input"
                    required
                    value={attForm.employeeId}
                    onChange={e => setAttForm({ ...attForm, employeeId: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.role?.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </F>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <F label="Shift Date *">
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={attForm.date}
                      onChange={e => setAttForm({ ...attForm, date: e.target.value })}
                    />
                  </F>
                  <F label="Check-Out Time *">
                    <input
                      type="time"
                      className="form-input"
                      required
                      value={attForm.time}
                      onChange={e => setAttForm({ ...attForm, time: e.target.value })}
                    />
                  </F>
                </div>

                <div className="alert" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: '0.82rem' }}>
                  ⚠️ <strong>Validation Rule:</strong> Check-out cannot be performed before check-in. Check-out time must be after recorded check-in time.
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Checking Out...' : 'Confirm Check-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. RECORD ATTENDANCE MODAL */}
      {modal === 'recordAttendance' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📝 Record Attendance Entry</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleRecordAttendanceSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Staff Member *">
                    <select
                      className="form-input"
                      required
                      value={attForm.employeeId}
                      onChange={e => setAttForm({ ...attForm, employeeId: e.target.value })}
                    >
                      <option value="">Select Employee</option>
                      {employees.filter(e => e.employmentStatus === 'ACTIVE').map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.role?.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                  </F>
                </div>

                <F label="Attendance Date *">
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={attForm.date}
                    onChange={e => setAttForm({ ...attForm, date: e.target.value })}
                  />
                </F>

                <F label="Attendance Status *">
                  <select
                    className="form-input"
                    value={attForm.attendanceStatus}
                    onChange={e => setAttForm({ ...attForm, attendanceStatus: e.target.value })}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </F>

                <F label="Check-In Time">
                  <input
                    type="time"
                    className="form-input"
                    value={attForm.checkIn}
                    onChange={e => setAttForm({ ...attForm, checkIn: e.target.value })}
                  />
                </F>

                <F label="Check-Out Time">
                  <input
                    type="time"
                    className="form-input"
                    value={attForm.checkOut}
                    onChange={e => setAttForm({ ...attForm, checkOut: e.target.value })}
                  />
                </F>
              </div>

              {attForm.checkIn && attForm.checkOut && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  color: '#93C5FD'
                }}>
                  ⏱️ <strong>Working Hours Preview:</strong> Shift duration will be calculated accurately from {attForm.checkIn} to {attForm.checkOut}.
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Recording...' : 'Save Attendance Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
