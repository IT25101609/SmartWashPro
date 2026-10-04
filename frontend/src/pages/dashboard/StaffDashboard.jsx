import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get('/dashboard/staff').then(r => setData(r.data)).catch(console.error); }, []);
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Staff Dashboard</h1><p>View and complete your assigned laundry tasks.</p></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': '#eab308', '--stat-bg': 'rgba(234,179,8,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">⏳</div></div>
          <div className="stat-value">{data?.myPendingTasks ?? 0}</div><div className="stat-label">Pending Tasks</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#22c55e', '--stat-bg': 'rgba(34,197,94,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">✅</div></div>
          <div className="stat-value">{data?.myCompletedTasks ?? 0}</div><div className="stat-label">Completed Tasks</div>
        </div>
      </div>
      <button className="btn btn-primary" onClick={() => navigate('/tasks')}>View My Tasks</button>
    </div>
  );
}
