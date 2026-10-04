import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiX, FiShoppingBag, FiShield, FiBriefcase, FiLock, FiMail } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there was a redirected from route
  const from = location.state?.from?.pathname || null;

  const handleLoginSuccess = (role) => {
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'BRANCH_MANAGER_ADMIN' || role === 'BRANCH_MANAGER') {
      navigate('/branch-manager/dashboard', { replace: true });
    } else {
      navigate('/customer/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      toast.success('Signed in successfully!');
      handleLoginSuccess(data.role);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword = 'password123', roleName = 'Customer') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');
    try {
      const data = await login(demoEmail, demoPassword);
      toast.success(`Signed in as ${roleName}!`);
      handleLoginSuccess(data.role);
    } catch (err) {
      console.error(err);
      setError('Failed to login with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0A0A10',
      background: 'radial-gradient(circle at 50% 35%, #181824 0%, #0A0A10 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
      overflowY: 'auto'
    }}>
      {/* Centered Glass Login Card (Identical to Modal Design) */}
      <div className="card-glass" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem 2.25rem',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 107, 0, 0.2)',
        borderRadius: '16px'
      }}>
        {/* Close Button back to home */}
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#888899',
            cursor: 'pointer',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
          onMouseLeave={e => e.currentTarget.style.color = '#888899'}
          title="Return to Home"
        >
          <FiX />
        </button>

        {/* Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>🧺</div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
            Sign In to SmartWash Pro
          </h2>
          <p style={{ color: '#888899', fontSize: '0.85rem', margin: 0 }}>
            Please log in to your account or use quick demo logins.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.2rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Email Address</label>
            <input
              type="email"
              className="form-input"
              required
              placeholder="admin@smartwash.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.35rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Password</label>
            <input
              type="password"
              className="form-input"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '0.98rem',
              fontWeight: 700,
              backgroundColor: '#FF6B00',
              borderRadius: '10px'
            }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In & Proceed'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: '#888899' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#FF6B00', fontWeight: 600, textDecoration: 'none' }}>
            Register Free
          </Link>
        </div>
      </div>
    </div>
  );
}

