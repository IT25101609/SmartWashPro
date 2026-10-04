import React from 'react';

const DashboardCard = ({ title, value, subtitle, icon, trend, color = 'var(--primary)' }) => {
  return (
    <div className="card-glass" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: color }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>{title}</p>
          <h3 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700, color: 'white' }}>{value}</h3>
          {subtitle && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--text-muted)' }}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {subtitle}
            </p>
          )}
        </div>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `rgba(${color === 'var(--primary)' ? '255,107,0' : '255,255,255'}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, fontSize: '1.5rem' }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
