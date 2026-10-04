import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/services').then(res => setServices(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleAvailable = async (id, current) => {
    await api.put(`/services/${id}`, { available: !current });
    setServices(services.map(s => s.id === id ? {...s, available: !current} : s));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Laundry Services</h1><p>Manage service catalog and pricing</p></div>
      </div>
      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {services.map(s => (
            <div key={s.id} className="card" style={{ opacity: s.available ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.serviceName}</h3>
                  {s.category && <span className="badge badge-info" style={{ marginTop: 4 }}>{s.category}</span>}
                </div>
                <span className={`badge ${s.available ? 'badge-success' : 'badge-neutral'}`}>{s.available ? 'Active' : 'Inactive'}</span>
              </div>
              {s.description && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{s.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>Rs. {s.price}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 6 }}>/ {s.pricingType?.replace('_',' ')}</span>
                </div>
                {user?.role === 'BRANCH_MANAGER' && (
                  <button className={`btn btn-sm ${s.available ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => toggleAvailable(s.id, s.available)}>
                    {s.available ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
