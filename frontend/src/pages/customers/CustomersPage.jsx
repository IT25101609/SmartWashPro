import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Edit Modal State
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', address: '', status: 'ACTIVE', loyaltyPoints: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Delete Modal State
  const [deleteCustomer, setDeleteCustomer] = useState(null);

  const { user } = useAuth();
  const isManagerOrReceptionist = ['BRANCH_MANAGER', 'RECEPTIONIST'].includes(user?.role);
  const isManager = user?.role === 'BRANCH_MANAGER';

  const fetchCustomers = () => {
    setLoading(true);
    api.get('/customers', { params: { search: search || undefined, page, size: 15 } })
      .then(res => {
        setCustomers(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchCustomers, [page]);

  const handleEditClick = (c) => {
    setEditCustomer(c);
    setEditForm({
      fullName: c.fullName || '',
      phoneNumber: c.phoneNumber || '',
      address: c.address || '',
      status: c.status || 'ACTIVE',
      loyaltyPoints: c.loyaltyPoints || 0
    });
    setMessage({ type: '', text: '' });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editCustomer) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    api.put(`/customers/${editCustomer.id}`, editForm)
      .then(() => {
        setMessage({ type: 'success', text: 'Customer updated successfully!' });
        setTimeout(() => {
          setEditCustomer(null);
          fetchCustomers();
        }, 800);
      })
      .catch(err => {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update customer' });
      })
      .finally(() => setSaving(false));
  };

  const handleDeleteConfirm = () => {
    if (!deleteCustomer) return;
    setSaving(true);
    api.delete(`/customers/${deleteCustomer.id}`)
      .then(() => {
        setDeleteCustomer(null);
        fetchCustomers();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Failed to delete customer');
      })
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customers Management</h1>
          <p>View, edit, and manage customer accounts and loyalty details</p>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-input-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (setPage(0), fetchCustomers())}
          />
        </div>
        <button className="btn btn-secondary" onClick={() => { setPage(0); fetchCustomers(); }}>
          Search
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Orders</th>
                  <th>Spent</th>
                  <th>Points</th>
                  <th>Status</th>
                  {isManagerOrReceptionist && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{c.fullName}</td>
                    <td>{c.email}</td>
                    <td>{c.phoneNumber || 'N/A'}</td>
                    <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address || 'N/A'}</td>
                    <td>{c.totalOrders}</td>
                    <td>Rs. {c.totalSpent?.toLocaleString()}</td>
                    <td><span className="badge badge-primary">⭐ {c.loyaltyPoints}</span></td>
                    <td>
                      <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                        {c.status}
                      </span>
                    </td>
                    {isManagerOrReceptionist && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            title="Edit Customer"
                            onClick={() => handleEditClick(c)}
                          >
                            ✏️ Edit
                          </button>
                          {isManager && (
                            <button
                              className="btn btn-sm btn-danger"
                              title="Delete/Block Customer"
                              onClick={() => setDeleteCustomer(c)}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!customers.length && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <h3>No customers found</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Page {page + 1} of {totalPages}</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</button>
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editCustomer && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>✏️ Edit Customer: {editCustomer.fullName}</h2>
              <button className="modal-close-btn" onClick={() => setEditCustomer(null)}>✕</button>
            </div>
            {message.text && (
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.phoneNumber}
                  onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-input"
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Loyalty Points ⭐</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.loyaltyPoints}
                    onChange={e => setEditForm({ ...editForm, loyaltyPoints: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditCustomer(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER CONFIRMATION MODAL */}
      {deleteCustomer && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>⚠️ Delete Customer Account</h2>
              <button className="modal-close-btn" onClick={() => setDeleteCustomer(null)}>✕</button>
            </div>
            <p style={{ margin: '16px 0', color: 'var(--color-text-secondary)' }}>
              Are you sure you want to block/remove customer <strong>{deleteCustomer.fullName}</strong> ({deleteCustomer.email})?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteCustomer(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm} disabled={saving}>
                {saving ? 'Processing...' : 'Yes, Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
