import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DriverDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get('/dashboard/driver').then(r => setData(r.data)).catch(console.error); }, []);
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Driver Dashboard</h1><p>Manage your pickups and deliveries for today.</p></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': '#3b82f6', '--stat-bg': 'rgba(59,130,246,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">🚗</div></div>
          <div className="stat-value">{data?.todayPickups ?? 0}</div><div className="stat-label">Today's Pickups</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#22c55e', '--stat-bg': 'rgba(34,197,94,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">📦</div></div>
          <div className="stat-value">{data?.todayDeliveries ?? 0}</div><div className="stat-label">Today's Deliveries</div>
        </div>
      </div>
      <button className="btn btn-primary" onClick={() => navigate('/pickups')}>View Pickups</button>
    </div>
  );
}
