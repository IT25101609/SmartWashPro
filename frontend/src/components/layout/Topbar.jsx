import React from 'react';
import { FiBell, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Topbar = () => {
  const { user } = useAuth();
  
  return (
    <header style={{
      height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input type="text" className="form-input" placeholder="Search orders, customers..." style={{ paddingLeft: '2.5rem', borderRadius: '20px' }} />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button style={{ position: 'relative', color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
          <FiBell />
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '15px', height: '15px', backgroundColor: 'var(--primary)', borderRadius: '50%', fontSize: '0.6rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600 }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
