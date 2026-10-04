import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function ReceptionistDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get('/dashboard/receptionist').then(r => setData(r.data)).catch(console.error); }, []);
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Receptionist Dashboard</h1><p>Manage incoming orders and customer interactions.</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/orders/new')}>➕ New Order</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': '#f97316', '--stat-bg': 'rgba(249,115,22,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">📦</div></div>
          <div className="stat-value">{data?.totalOrders ?? 0}</div><div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#eab308', '--stat-bg': 'rgba(234,179,8,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">⏳</div></div>
          <div className="stat-value">{data?.pendingOrders ?? 0}</div><div className="stat-label">Pending Orders</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#ef4444', '--stat-bg': 'rgba(239,68,68,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">💳</div></div>
          <div className="stat-value">{data?.pendingPaymentsCount ?? 0}</div><div className="stat-label">Pending Payments</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>View All Orders</button>
        <button className="btn btn-secondary" onClick={() => navigate('/customers')}>View Customers</button>
        <button className="btn btn-secondary" onClick={() => navigate('/payments')}>View Payments</button>
      </div>
    </div>
  );
}
