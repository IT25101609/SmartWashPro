import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_BADGES = {
  LOW: 'badge-neutral',
  MEDIUM: 'badge-info',
  HIGH: 'badge-warning',
  URGENT: 'badge-error'
};

const STATUS_BADGES = {
  PENDING: 'badge-warning',
  IN_PROGRESS: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-error'
};

const TASK_TYPES = [
  'WASH', 'IRON', 'DRY_CLEAN', 'FOLD', 'PICKUP', 'DELIVERY', 'MAINTENANCE', 'OTHER'
];

const F = ({ label, children, required = false }) => (
  <div className="form-group" style={{ marginBottom: 12 }}>
    <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: 4, display: 'block', color: 'var(--color-text-secondary)' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    {children}
  </div>
);

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');

  // Modals: 'create' | 'details' | 'edit'
  const [modal, setModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    taskType: 'WASH',
    priority: 'MEDIUM',
    dueDate: '',
    orderId: ''
  });

  // Load active & all employees for dropdowns
  const loadEmployees = () => {
    api.get('/employees', { params: { size: 100 } })
      .then(res => setEmployees(res.data.content || []))
      .catch(() => {});
  };

  // Load tasks with filters
  const loadTasks = () => {
    setLoading(true);
    const params = { size: 100 };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (priorityFilter !== 'ALL') params.priority = priorityFilter;
    if (employeeFilter !== 'ALL') params.employeeId = employeeFilter;

    api.get('/tasks', { params })
      .then(res => setTasks(res.data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [search, statusFilter, priorityFilter, employeeFilter]);

  // Modal Openers
  const openCreateModal = () => {
    const activeStaff = employees.filter(e => e.employmentStatus === 'ACTIVE');
    setForm({
      employeeId: activeStaff.length > 0 ? activeStaff[0].id : '',
      title: '',
      description: '',
      taskType: 'WASH',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      orderId: ''
    });
    setError('');
    setModal('create');
  };

  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setError('');
    setModal('details');
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setForm({
      employeeId: task.employeeId || '',
      title: task.title || task.taskTitle || '',
      description: task.description || task.taskDescription || '',
      taskType: task.taskType || 'OTHER',
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate ? task.dueDate.slice(0, 16) : '',
      orderId: task.orderId || ''
    });
    setError('');
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedTask(null);
    setError('');
  };

  // Status updates & Workflow
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/tasks/${id}/status`, { status: newStatus });
      loadTasks();
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(prev => ({ ...prev, taskStatus: newStatus }));
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Status transition failed');
    }
  };

  const handleMarkCompleted = async (id) => {
    try {
      await api.put(`/tasks/${id}/complete`);
      loadTasks();
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(prev => ({ ...prev, taskStatus: 'COMPLETED' }));
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleCancelTask = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this task?')) return;
    try {
      await api.put(`/tasks/${id}/cancel`);
      loadTasks();
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(prev => ({ ...prev, taskStatus: 'CANCELLED' }));
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel task');
    }
  };

  // Form Submit: Create Task
  const handleCreateSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');

    // Pre-check inactive employee on client
    const targetEmp = employees.find(e => String(e.id) === String(form.employeeId));
    if (targetEmp && targetEmp.employmentStatus !== 'ACTIVE') {
      setError(`Cannot assign task: ${targetEmp.fullName} is currently INACTIVE.`);
      setSaving(false);
      return;
    }

    try {
      await api.post('/tasks', {
        employeeId: Number(form.employeeId),
        title: form.title.trim(),
        description: form.description.trim(),
        taskType: form.taskType,
        priority: form.priority,
        dueDate: form.dueDate ? form.dueDate : undefined,
        orderId: form.orderId ? Number(form.orderId) : undefined
      });
      closeModal();
      loadTasks();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  // Form Submit: Edit Task
  const handleEditSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        employeeId: Number(form.employeeId),
        title: form.title.trim(),
        description: form.description.trim(),
        taskType: form.taskType,
        priority: form.priority,
        dueDate: form.dueDate ? form.dueDate : undefined,
        orderId: form.orderId ? Number(form.orderId) : undefined
      });
      closeModal();
      loadTasks();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.taskStatus === 'PENDING').length;
  const inProgressTasks = tasks.filter(t => t.taskStatus === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.taskStatus === 'COMPLETED').length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.75rem', fontWeight: 800 }}>
            <span>💼</span> Employee Task Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Assign laundry orders, track task workflows (Pending → In Progress → Completed), and oversee staff duty completion
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          <span>➕</span> Create Task
        </button>
      </div>

      {/* METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #FF6B00' }}>
          <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>TOTAL TASKS</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{totalTasks}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>All tracked assignments</div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>PENDING</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>{pendingTasks}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>Awaiting staff start</div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>IN PROGRESS</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#3B82F6', marginTop: '4px' }}>{inProgressTasks}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>Currently being processed</div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #22C55E' }}>
          <div style={{ fontSize: '0.8rem', color: '#A0A0B0', fontWeight: 600 }}>COMPLETED</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#22C55E', marginTop: '4px' }}>{completedTasks}</div>
          <div style={{ fontSize: '0.75rem', color: '#A0A0B0', marginTop: '2px' }}>Successfully fulfilled</div>
        </div>
      </div>

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
          {/* Search Input */}
          <div style={{ minWidth: 260, flex: 1 }}>
            <input
              className="form-input"
              placeholder="🔍 Search title, description, staff name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Filter by Employee */}
          <div>
            <select
              className="form-input"
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              style={{ padding: '8px 12px', minWidth: 180 }}
            >
              <option value="ALL">All Staff Members</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.role?.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              className="form-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', minWidth: 140 }}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Filter by Priority */}
          <div>
            <select
              className="form-input"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{ padding: '8px 12px', minWidth: 130 }}
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || employeeFilter !== 'ALL') && (
            <button
              className="btn btn-outline"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setEmployeeFilter('ALL');
              }}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              Reset
            </button>
          )}
        </div>

        <button
          className="btn btn-outline"
          onClick={loadTasks}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          🔄 Refresh Tasks
        </button>
      </div>

      {/* TASKS TABLE */}
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
                  <th>Task Title / ID</th>
                  <th>Assignee</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Workflow Action</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => {
                  const isPending = t.taskStatus === 'PENDING';
                  const isInProgress = t.taskStatus === 'IN_PROGRESS';
                  const isCompleted = t.taskStatus === 'COMPLETED';
                  const isCancelled = t.taskStatus === 'CANCELLED';

                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {t.title || t.taskTitle || `Task #${t.id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#FF6B00', fontWeight: 600 }}>
                          ID: #{t.id} {t.orderId ? `• Order #${t.orderId}` : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{t.employeeName}</div>
                        {t.employeeRole && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {t.employeeRole.replace(/_/g, ' ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info">{t.taskType?.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <span className={`badge ${PRIORITY_BADGES[t.priority] || 'badge-neutral'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {t.dueDate ? (
                          <span style={{ color: new Date(t.dueDate) < new Date() && !isCompleted && !isCancelled ? '#EF4444' : 'inherit' }}>
                            {t.dueDate.split('T')[0]} {t.dueDate.includes('T') ? t.dueDate.split('T')[1].slice(0, 5) : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGES[t.taskStatus] || 'badge-neutral'}`}>
                          {t.taskStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {/* Interactive Workflow Buttons */}
                        {isPending && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: 'rgba(59,130,246,0.5)', color: '#60A5FA' }}
                            onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                            title="Start Task"
                          >
                            ▶ Start
                          </button>
                        )}
                        {isInProgress && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: 'rgba(34,197,94,0.5)', color: '#4ADE80' }}
                            onClick={() => handleMarkCompleted(t.id)}
                            title="Mark as Completed"
                          >
                            ✓ Complete
                          </button>
                        )}
                        {isCompleted && (
                          <span style={{ color: '#22C55E', fontSize: '0.8rem', fontWeight: 600 }}>
                            ✓ Fulfilled
                          </span>
                        )}
                        {isCancelled && (
                          <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => openDetailsModal(t)}
                            title="View Full Task Details"
                          >
                            👁️ View
                          </button>

                          {!isCompleted && !isCancelled && (
                            <>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => openEditModal(t)}
                                title="Edit Task"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => handleCancelTask(t.id)}
                                title="Cancel Task"
                              >
                                ✕ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!tasks.length && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                        <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>💼</div>
                        <h3 style={{ marginTop: '0.5rem' }}>No tasks found</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          Create a new task to assign work items to your laundry operations team.
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

      {/* ================= MODALS ================= */}

      {/* 1. CREATE TASK MODAL */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Create Operational Task</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Assign Employee" required>
                    <select
                      className="form-input"
                      required
                      value={form.employeeId}
                      onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    >
                      <option value="">Select Assignee</option>
                      {employees.map(emp => (
                        <option
                          key={emp.id}
                          value={emp.id}
                          disabled={emp.employmentStatus !== 'ACTIVE'}
                        >
                          {emp.fullName} — {emp.role?.replace(/_/g, ' ')} {emp.branchName ? `(${emp.branchName})` : ''} {emp.employmentStatus !== 'ACTIVE' ? '[INACTIVE - Cannot Assign]' : ''}
                        </option>
                      ))}
                    </select>
                  </F>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Task Title" required>
                    <input
                      className="form-input"
                      required
                      placeholder="e.g. Wash and Press Delicate Evening Gowns"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </F>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Detailed Instructions & Description" required>
                    <textarea
                      className="form-input"
                      rows={3}
                      required
                      placeholder="Provide specific operational details, delicate handling notes, detergent types..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </F>
                </div>

                <F label="Task Type">
                  <select
                    className="form-input"
                    value={form.taskType}
                    onChange={e => setForm({ ...form, taskType: e.target.value })}
                  >
                    {TASK_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </F>

                <F label="Priority Level">
                  <select
                    className="form-input"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </F>

                <F label="Due Date & Time">
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  />
                </F>

                <F label="Related Order ID (Optional)">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 101"
                    value={form.orderId}
                    onChange={e => setForm({ ...form, orderId: e.target.value })}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Creating...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT TASK MODAL */}
      {modal === 'edit' && selectedTask && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ Edit Task #{selectedTask.id}</h3>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Reassign Employee" required>
                    <select
                      className="form-input"
                      required
                      value={form.employeeId}
                      onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    >
                      {employees.map(emp => (
                        <option
                          key={emp.id}
                          value={emp.id}
                          disabled={emp.employmentStatus !== 'ACTIVE'}
                        >
                          {emp.fullName} — {emp.role?.replace(/_/g, ' ')} {emp.employmentStatus !== 'ACTIVE' ? '[INACTIVE]' : ''}
                        </option>
                      ))}
                    </select>
                  </F>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Task Title" required>
                    <input
                      className="form-input"
                      required
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </F>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <F label="Description & Notes" required>
                    <textarea
                      className="form-input"
                      rows={3}
                      required
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </F>
                </div>

                <F label="Task Type">
                  <select
                    className="form-input"
                    value={form.taskType}
                    onChange={e => setForm({ ...form, taskType: e.target.value })}
                  >
                    {TASK_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </F>

                <F label="Priority Level">
                  <select
                    className="form-input"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </F>

                <F label="Due Date">
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  />
                </F>

                <F label="Related Order ID">
                  <input
                    type="number"
                    className="form-input"
                    value={form.orderId}
                    onChange={e => setForm({ ...form, orderId: e.target.value })}
                  />
                </F>
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

      {/* 3. VIEW TASK DETAILS MODAL */}
      {modal === 'details' && selectedTask && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>
                    {selectedTask.title || selectedTask.taskTitle || `Task #${selectedTask.id}`}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Task ID #{selectedTask.id} • Created {selectedTask.createdAt ? selectedTask.createdAt.split('T')[0] : 'recently'}
                  </div>
                </div>
              </div>
              <button className="btn btn-icon" onClick={closeModal}>✕</button>
            </div>

            {/* Quick Status Bar */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '12px 16px',
              margin: '1rem 0'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'block' }}>CURRENT STATUS</span>
                <span className={`badge ${STATUS_BADGES[selectedTask.taskStatus] || 'badge-neutral'}`} style={{ marginTop: 2 }}>
                  {selectedTask.taskStatus}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'block' }}>PRIORITY</span>
                <span className={`badge ${PRIORITY_BADGES[selectedTask.priority] || 'badge-neutral'}`} style={{ marginTop: 2 }}>
                  {selectedTask.priority}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'block' }}>TYPE</span>
                <span className="badge badge-info" style={{ marginTop: 2 }}>
                  {selectedTask.taskType?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card-glass" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Assigned Staff Member</div>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 3 }}>{selectedTask.employeeName}</div>
                {selectedTask.employeeRole && (
                  <div style={{ fontSize: '0.75rem', color: '#FF6B00' }}>
                    {selectedTask.employeeRole.replace(/_/g, ' ')}
                  </div>
                )}
                {selectedTask.employeePhone && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    📞 {selectedTask.employeePhone}
                  </div>
                )}
              </div>

              <div className="card-glass" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Due Date & Deadline</div>
                <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 3 }}>
                  {selectedTask.dueDate ? (
                    <>
                      📅 {selectedTask.dueDate.split('T')[0]} {selectedTask.dueDate.includes('T') ? `• ⏰ ${selectedTask.dueDate.split('T')[1].slice(0, 5)}` : ''}
                    </>
                  ) : 'No due date set'}
                </div>
                {selectedTask.assignedByName && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Assigned by: {selectedTask.assignedByName}
                  </div>
                )}
              </div>

              <div className="card-glass" style={{ padding: '1rem', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>Task Description & Instructions</div>
                <div style={{ color: '#FFFFFF', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {selectedTask.description || selectedTask.taskDescription || 'No description provided.'}
                </div>
              </div>
            </div>

            {/* Workflow Transition Action Footer */}
            <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedTask.taskStatus === 'PENDING' && (
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: 'rgba(59,130,246,0.5)', color: '#60A5FA' }}
                    onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}
                  >
                    ▶ Advance to IN_PROGRESS
                  </button>
                )}
                {selectedTask.taskStatus === 'IN_PROGRESS' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#22C55E', borderColor: '#22C55E' }}
                    onClick={() => handleMarkCompleted(selectedTask.id)}
                  >
                    ✓ Mark as COMPLETED
                  </button>
                )}
                {selectedTask.taskStatus !== 'COMPLETED' && selectedTask.taskStatus !== 'CANCELLED' && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleCancelTask(selectedTask.id)}
                  >
                    ✕ Cancel Task
                  </button>
                )}
              </div>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
