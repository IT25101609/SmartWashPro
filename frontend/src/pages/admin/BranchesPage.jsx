import React, { useState, useEffect } from 'react';
import branchService from '../../services/branchService';
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiPlus, FiEdit2, FiPhone, FiCheckCircle, 
  FiAlertCircle, FiLayers, FiCalendar, FiX 
} from 'react-icons/fi';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    phone: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await branchService.getBranches();
      setBranches(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBranch(null);
    setForm({
      branchName: '',
      branchCode: '',
      address: '',
      phone: '',
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBranch(b);
    setForm({
      branchName: b.branchName || '',
      branchCode: b.branchCode || '',
      address: b.address || '',
      phone: b.phone || '',
      status: b.status || 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingBranch) {
        await branchService.updateBranch(editingBranch.id, {
          branchName: form.branchName,
          address: form.address,
          phone: form.phone,
          status: form.status
        });
        toast.success('Branch details updated!');
      } else {
        await branchService.createBranch({
          branchName: form.branchName,
          branchCode: form.branchCode.toUpperCase().trim(),
          address: form.address,
          phone: form.phone,
          status: form.status
        });
        toast.success('New branch registered successfully!');
      }
      setModalOpen(false);
      loadBranches();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
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
            <FiMapPin style={{ color: '#FF6B00' }} /> System Branches
          </h1>
          <p style={{ color: '#A0A0B0', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Operational branch locations for SmartWash Pro commercial laundry services.
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Add New Branch
        </button>
      </div>

      {/* Grid of Branch Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#A0A0B0' }}>
          Loading Branches...
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.25rem' 
        }}>
          {branches.map(b => (
            <div key={b.id} className="card-glass" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ 
                    background: 'rgba(255, 107, 0, 0.12)', 
                    color: '#FF6B00', 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700 
                  }}>
                    {b.branchCode}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#FFFFFF' }}>
                    {b.branchName}
                  </h3>
                </div>
                <span className={`badge ${b.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                  {b.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#A0A0B0', fontSize: '0.85rem' }}>
                  <FiMapPin style={{ color: '#FF6B00', flexShrink: 0 }} />
                  <span>{b.address || 'Address not specified'}</span>
                </div>
                {b.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#A0A0B0', fontSize: '0.85rem' }}>
                    <FiPhone style={{ color: '#3B82F6', flexShrink: 0 }} />
                    <span>{b.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#707080', fontSize: '0.75rem' }}>
                  <FiCalendar flexShrink={0} />
                  <span>Created: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => openEditModal(b)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '4px 12px' }}
                >
                  <FiEdit2 size={13} /> Edit Branch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              maxWidth: '520px', 
              background: '#161f30', 
              border: '1px solid rgba(249, 115, 22, 0.35)', 
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              position: 'relative'
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
                  <FiMapPin size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {editingBranch ? 'Edit Branch' : 'Register New Branch'}
                  </h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {editingBranch ? 'Update location, contact info, and status.' : 'Register a new operational laundry branch location.'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.15rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                    Branch Name <span style={{ color: '#f97316' }}>*</span>
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
                    value={form.branchName}
                    onChange={e => setForm({...form, branchName: e.target.value})}
                    placeholder="e.g. Colombo Central"
                    onFocus={e => e.target.style.borderColor = '#f97316'}
                    onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                    Code <span style={{ color: '#f97316' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      background: editingBranch ? '#121a29' : '#0d1524',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      color: editingBranch ? '#94a3b8' : '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: editingBranch ? 'not-allowed' : 'text'
                    }}
                    required
                    disabled={!!editingBranch}
                    value={form.branchCode}
                    onChange={e => setForm({...form, branchCode: e.target.value})}
                    placeholder="e.g. COL-01"
                    onFocus={e => !editingBranch && (e.target.style.borderColor = '#f97316')}
                    onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Branch Address <span style={{ color: '#f97316' }}>*</span>
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
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="e.g. 123 Galle Road, Colombo 03"
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
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
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+94 11 234 5678"
                    onFocus={e => e.target.style.borderColor = '#f97316'}
                    onBlur={e => e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                    Status
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
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value})}
                  >
                    <option value="ACTIVE" style={{ background: '#161f30', color: '#10b981' }}>● ACTIVE</option>
                    <option value="INACTIVE" style={{ background: '#161f30', color: '#ef4444' }}>● INACTIVE</option>
                  </select>
                </div>
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
                  {saving ? 'Saving...' : (editingBranch ? 'Save Changes' : 'Register Branch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
