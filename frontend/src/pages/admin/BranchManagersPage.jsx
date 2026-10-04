import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import branchService from '../../services/branchService';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiShield, 
  FiCheckCircle, FiXCircle, FiMapPin, FiMail, FiPhone, FiX 
} from 'react-icons/fi';

export default function BranchManagersPage() {
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    branchId: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mgrRes, brRes] = await Promise.all([
        adminService.getBranchManagers(),
        branchService.getBranches()
      ]);
      setManagers(mgrRes.data || []);
      setBranches(brRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load branch managers');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingManager(null);
    setForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      branchId: branches[0]?.id || '',
      password: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (mgr) => {
    setEditingManager(mgr);
    setForm({
      fullName: mgr.fullName || '',
      email: mgr.email || '',
      phoneNumber: mgr.phoneNumber || '',
      address: mgr.address || '',
      branchId: mgr.branchId || branches[0]?.id || '',
      password: ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.branchId) {
      toast.error('Please assign a branch');
      return;
    }

    try {
      setSaving(true);
      if (editingManager) {
        await adminService.updateBranchManager(editingManager.id, {
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          address: form.address,
          branchId: Number(form.branchId),
          password: form.password || undefined
        });
        toast.success('Branch Manager updated successfully!');
      } else {
        await adminService.createBranchManager({
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          address: form.address,
          branchId: Number(form.branchId),
          password: form.password || 'password123'
        });
        toast.success('New Branch Manager created successfully!');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save branch manager');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mgr) => {
    if (!window.confirm(`Are you sure you want to deactivate Branch Manager ${mgr.fullName}?`)) return;
    try {
      await adminService.deleteBranchManager(mgr.id);
      toast.success('Branch Manager deactivated');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to deactivate manager');
    }
  };

  return (
    <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FiUsers style={{ color: '#FF6B00' }} /> Branch Managers
          </h1>
          <p style={{ color: '#A0A0B0', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Manage and assign operational administrators strictly restricted to their designated branches.
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Create Branch Manager
        </button>
      </div>

      {/* Table Card */}
      <div className="card-glass" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#A0A0B0' }}>
            Loading Branch Managers...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Manager Name</th>
                  <th>Contact Info</th>
                  <th>Assigned Branch</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#707080' }}>
                      No branch managers found. Click "Create Branch Manager" to add one.
                    </td>
                  </tr>
                ) : (
                  managers.map(mgr => (
                    <tr key={mgr.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 107, 0, 0.15)',
                            color: '#FF6B00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {mgr.fullName?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{mgr.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888899' }}>ID: #{mgr.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#D0D0E0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiMail size={13} style={{ color: '#FF6B00' }} /> {mgr.email}
                        </div>
                        {mgr.phoneNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#888899', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <FiPhone size={12} /> {mgr.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          color: '#60A5FA',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          <FiMapPin size={13} /> {mgr.branchName} ({mgr.branchCode})
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${mgr.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {mgr.status}
                        </span>
                      </td>
                      <td style={{ color: '#888899', fontSize: '0.8rem' }}>
                        {mgr.createdAt ? new Date(mgr.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEditModal(mgr)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            title="Edit Manager"
                          >
                            <FiEdit2 />
                          </button>
                          {mgr.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleDelete(mgr)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                              title="Deactivate Manager"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '540px', 
              background: '#161f30', 
              border: '1px solid rgba(249, 115, 22, 0.35)', 
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f97316'
                }}>
                  <FiUsers size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {editingManager ? 'Edit Branch Manager' : 'Create New Branch Manager'}
                  </h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {editingManager ? 'Update branch assignment or profile credentials.' : 'Assign a manager to supervise a specific branch.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                title="Close"
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Full Name <span style={{ color: '#f97316' }}>*</span>
                </label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    background: '#0d1524',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  required
                  value={form.fullName}
                  onChange={e => setForm({...form, fullName: e.target.value})}
                  placeholder="e.g. Sunil Perera"
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Email Address <span style={{ color: '#f97316' }}>*</span>
                </label>
                <input
                  type="email"
                  style={{
                    width: '100%',
                    background: editingManager ? '#121a29' : '#0d1524',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: editingManager ? '#94a3b8' : '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: editingManager ? 'not-allowed' : 'text'
                  }}
                  required
                  disabled={!!editingManager}
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="manager@smartwash.com"
                  onFocus={e => !editingManager && (e.target.style.borderColor = '#f97316')}
                  onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                />
                {editingManager && (
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    Email cannot be changed after creation.
                  </p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Assigned Branch <span style={{ color: '#f97316' }}>*</span>
                </label>
                <select
                  style={{
                    width: '100%',
                    background: '#0d1524',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  required
                  value={form.branchId}
                  onChange={e => setForm({...form, branchId: e.target.value})}
                >
                  <option value="" style={{ background: '#161f30', color: '#94a3b8' }}>Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id} style={{ background: '#161f30', color: '#ffffff' }}>
                      {b.branchName} ({b.branchCode}) - {b.address}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.15rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      background: '#0d1524',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    value={form.phoneNumber}
                    onChange={e => setForm({...form, phoneNumber: e.target.value})}
                    placeholder="+94 77 123 4567"
                    onFocus={e => e.target.style.borderColor = '#f97316'}
                    onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                    {editingManager ? 'Reset Password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      background: '#0d1524',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={editingManager ? 'Leave blank to keep' : 'Default: password123'}
                    onFocus={e => e.target.style.borderColor = '#f97316'}
                    onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Office Address
                </label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    background: '#0d1524',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Branch office address"
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '0.65rem 1.25rem',
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#cbd5e1'; }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#f97316',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.4rem',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#ea580c'; }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#f97316'; }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingManager ? 'Save Changes' : 'Create Manager')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
