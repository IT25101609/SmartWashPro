import React, { useState, useEffect } from 'react';
import DashboardCard from '../../components/common/DashboardCard';
import { FiCheckSquare, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Mock API call
    setTimeout(() => {
      setTasks([
        { id: 'TSK-001', orderId: 'ORD-1234', desc: 'Wash & Iron - 5 Shirts', status: 'PENDING' },
        { id: 'TSK-002', orderId: 'ORD-1235', desc: 'Dry Cleaning - 1 Suit', status: 'IN_PROGRESS' },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>My Tasks</h2>
        <p>Your pending tasks for today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <DashboardCard title="Pending Tasks" value={tasks.filter(t => t.status==='PENDING').length} icon={<FiClock />} color="var(--warning)" />
        <DashboardCard title="In Progress" value={tasks.filter(t => t.status==='IN_PROGRESS').length} icon={<FiClock />} color="var(--info)" />
        <DashboardCard title="Completed Today" value="12" icon={<FiCheckSquare />} color="var(--success)" />
      </div>

      <div className="card-glass">
        <h3>Current Queue</h3>
        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Order ID</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td style={{ fontWeight: 500 }}>{task.id}</td>
                <td>{task.orderId}</td>
                <td>{task.desc}</td>
                <td><span className={`badge ${task.status === 'PENDING' ? 'badge-warning' : 'badge-info'}`}>{task.status.replace('_', ' ')}</span></td>
                <td>
                  {task.status === 'PENDING' ? (
                     <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Start Task</button>
                  ) : (
                     <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffDashboard;
