import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import { 
  FiUser, FiSearch, FiFilter, FiCheckCircle, 
  FiXCircle, FiShield, FiBriefcase, FiMail, FiPhone, FiLock 
} from 'react-icons/fi';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        page,
        size: 15,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined
      });
      setUsers(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span style={{ 
            backgroundColor: 'rgba(255, 107, 0, 0.15)', 
            color: '#FF6B00', 
            border: '1px solid rgba(255, 107, 0, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            👑 Admin
          </span>
        );
      case 'BRANCH_MANAGER_ADMIN':
      case 'BRANCH_MANAGER':
        return (
          <span style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.15)', 
            color: '#60A5FA', 
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🏢 Branch Manager
          </span>
        );
      case 'CUSTOMER':
      default:
        return (
          <span style={{ 
            backgroundColor: 'rgba(34, 197, 94, 0.15)', 
            color: '#4ADE80', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🛒 Customer
          </span>
        );
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const matchName = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmail = u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchEmail;
  });

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
            <FiUser style={{ color: '#FF6B00' }} /> All Users
          </h1>
          <p style={{ color: '#A0A0B0', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            System-wide directory of all users (Strictly Admin, Branch Manager Admin, and Customers).
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card-glass" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0 0.75rem' }}>
          <FiSearch style={{ color: '#707080' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '0.6rem 0.75rem',
              width: '100%',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="BRANCH_MANAGER_ADMIN">Branch Manager</option>
          <option value="CUSTOMER">Customer</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card-glass" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#A0A0B0' }}>
            Loading System Users...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>System Role</th>
                  <th>Branch</th>
                  <th>Account Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#707080' }}>
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {u.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{u.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888899' }}>ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#D0D0E0' }}>{u.email}</div>
                        {u.phoneNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#888899' }}>{u.phoneNumber}</div>
                        )}
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        {u.branchId ? (
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#A0A0B0' }}>
                            Branch #{u.branchId}
                          </span>
                        ) : (
                          <span style={{ color: '#606070', fontSize: '0.8rem' }}>Islandwide / All Branches</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          u.status === 'ACTIVE' ? 'badge-success' :
                          u.status === 'BLOCKED' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ color: '#888899', fontSize: '0.8rem' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.role !== 'ADMIN' && (
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            {u.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleStatusChange(u.id, 'BLOCKED')}
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                                title="Block User"
                              >
                                Block
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#22C55E', borderColor: 'rgba(34,197,94,0.3)' }}
                                title="Activate User"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
