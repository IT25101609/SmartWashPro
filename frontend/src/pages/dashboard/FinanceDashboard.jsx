import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7'];

export default function FinanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/dashboard/finance').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const pieData = (data?.paymentMethodBreakdown || []).map(d => ({ name: d.method ? d.method.replace(/_/g,' ') : 'Payment', value: Number(d.amount || 0) }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Finance Dashboard</h1><p>Revenue overview and payment analytics.</p></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': '#22c55e', '--stat-bg': 'rgba(34,197,94,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">💰</div></div>
          <div className="stat-value">Rs. {(data?.totalRevenue ?? 0).toLocaleString()}</div><div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#f97316', '--stat-bg': 'rgba(249,115,22,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">📅</div></div>
          <div className="stat-value">Rs. {(data?.todayRevenue ?? 0).toLocaleString()}</div><div className="stat-label">Today's Revenue</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#22c55e', '--stat-bg': 'rgba(34,197,94,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">✅</div></div>
          <div className="stat-value">{data?.paidPayments ?? 0}</div><div className="stat-label">Paid Payments</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#eab308', '--stat-bg': 'rgba(234,179,8,0.1)' }}>
          <div className="stat-card-header"><div className="stat-icon">⏳</div></div>
          <div className="stat-value">{data?.pendingPaymentsCount ?? 0}</div><div className="stat-label">Pending Payments</div>
        </div>
      </div>
      {pieData.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">💳 Revenue by Payment Method</h3></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: Rs.${value.toLocaleString()}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
