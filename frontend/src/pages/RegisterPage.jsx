import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', address: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      toast.success('Registration successful! Welcome to SmartWash Pro.');
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      <div className="card-glass" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem 2.25rem',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 107, 0, 0.2)',
        borderRadius: '16px',
        margin: 'auto'
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
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
          onMouseLeave={e => e.currentTarget.style.color = '#888899'}
          title="Return to Home"
        >
          <FiX />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>🫧</div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
            Create Customer Account
          </h2>
          <p style={{ color: '#888899', fontSize: '0.85rem', margin: 0 }}>
            Join SmartWash Pro for fast, automated laundry service.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.2rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Full Name</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Kasun Perera"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Email Address</label>
              <input
                type="email"
                className="form-input"
                required
                placeholder="name@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Phone Number</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="077 123 4567"
                value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Delivery Address</label>
            <textarea
              className="form-input"
              rows={2}
              required
              placeholder="Your full delivery & pickup address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.35rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Password</label>
            <input
              type="password"
              className="form-input"
              required
              placeholder="Create a strong password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
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
            {loading ? 'Creating Account...' : 'Register & Get Started'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: '#888899' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#FF6B00', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
