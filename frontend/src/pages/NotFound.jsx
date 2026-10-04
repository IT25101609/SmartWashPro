import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, background: 'var(--color-bg-root)' }}>
      <div style={{ fontSize: '5rem' }}>🫧</div>
      <h1 style={{ fontSize: '3rem', fontFamily: 'Outfit, sans-serif' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Page not found</p>
      <button className="btn btn-primary" onClick={() => nav('/')}>Go Home</button>
    </div>
  );
}
