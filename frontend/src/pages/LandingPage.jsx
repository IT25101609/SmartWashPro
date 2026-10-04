import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import { 
  FiShoppingBag, FiTruck, FiClock, FiCheckCircle, 
  FiStar, FiArrowRight, FiShield, FiPhone, FiMapPin, 
  FiLock, FiMail, FiUser, FiX 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handlePlaceOrderClick = () => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'BRANCH_MANAGER_ADMIN' || user.role === 'BRANCH_MANAGER') {
        navigate('/branch-manager/dashboard');
      } else {
        navigate('/orders/new');
      }
    } else {
      setShowLoginModal(true);
    }
  };

  const handleModalLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const data = await login(loginEmail, loginPassword);
      toast.success('Signed in successfully!');
      setShowLoginModal(false);
      if (data.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.role === 'BRANCH_MANAGER_ADMIN' || data.role === 'BRANCH_MANAGER') {
        navigate('/branch-manager/dashboard');
      } else {
        navigate('/orders/new');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = async (email, password = 'password123') => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const data = await login(email, password);
      toast.success('Signed in as demo customer!');
      setShowLoginModal(false);
      navigate('/orders/new');
    } catch (err) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0A10', color: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(10, 10, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.9rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <Logo size="medium" />
          <nav style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }} className="hide-mobile">
            <a href="#services" style={{ color: '#A0A0B0', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#FF6B00'} onMouseLeave={e => e.target.style.color = '#A0A0B0'}>Services</a>
            <a href="#how-it-works" style={{ color: '#A0A0B0', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#FF6B00'} onMouseLeave={e => e.target.style.color = '#A0A0B0'}>How It Works</a>
            <a href="#branches" style={{ color: '#A0A0B0', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#FF6B00'} onMouseLeave={e => e.target.style.color = '#A0A0B0'}>Branches</a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#A0A0B0' }}>
                Hi, <strong style={{ color: '#FFFFFF' }}>{user.fullName || user.name}</strong>
              </span>
              <button 
                onClick={() => {
                  if (user.role === 'ADMIN') navigate('/admin/dashboard');
                  else if (user.role === 'BRANCH_MANAGER_ADMIN' || user.role === 'BRANCH_MANAGER') navigate('/branch-manager/dashboard');
                  else navigate('/customer/dashboard');
                }}
                className="btn btn-outline" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn btn-outline"
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}
              >
                Sign In
              </button>
              <button
                onClick={handlePlaceOrderClick}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FiShoppingBag /> Place Order
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Laundry Image + Dark Gradient */}
      <section style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7rem 1.5rem 4rem 1.5rem',
        backgroundImage: `linear-gradient(180deg, rgba(10, 10, 16, 0.72) 0%, rgba(10, 10, 16, 0.92) 80%, #0A0A10 100%), radial-gradient(circle at 50% 30%, rgba(255, 107, 0, 0.15) 0%, rgba(10, 10, 16, 0.6) 70%), url('/laundry-hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '840px', margin: '0 auto', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 107, 0, 0.15)',
            border: '1px solid rgba(255, 107, 0, 0.35)',
            color: '#FF6B00',
            padding: '6px 16px',
            borderRadius: '50px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <span>🫧</span> Crystal Clean Laundry & Fabric Care
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            letterSpacing: '-0.5px'
          }}>
            Fresh, Clean Laundry <br />
            <span style={{
              background: 'linear-gradient(135deg, #FF6B00 0%, #FFA800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Delivered Right To Your Door
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#D0D0E0',
            maxWidth: '650px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6,
            textShadow: '0 2px 10px rgba(0,0,0,0.7)'
          }}>
            Schedule a hassle-free pickup in seconds. Commercial grade washing machines, eco-friendly detergents, and 24-hour express turnaround.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handlePlaceOrderClick}
              style={{
                backgroundColor: '#FF6B00',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '1.1rem 2.5rem',
                fontSize: '1.15rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 8px 24px rgba(255, 107, 0, 0.45)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 107, 0, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 0, 0.45)';
              }}
            >
              <FiShoppingBag size={22} />
              <span>Place An Order Now</span>
              <FiArrowRight size={20} />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('services');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '12px',
                padding: '1.1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            >
              Explore Services
            </button>
          </div>

          {/* Quick Perks Bar */}
          <div style={{
            marginTop: '3.5rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '2.5rem',
            flexWrap: 'wrap',
            color: '#A0A0B0',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiTruck style={{ color: '#FF6B00' }} />
              <span>Doorstep Pickup & Delivery</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiClock style={{ color: '#FF6B00' }} />
              <span>24-Hour Express Turnaround</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiShield style={{ color: '#FF6B00' }} />
              <span>100% Fabric Care Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tailored For You
          </p>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.5rem 0' }}>
            Our Signature Laundry Services
          </h2>
          <p style={{ color: '#888899', maxWidth: '520px', margin: '0 auto' }}>
            Choose from daily casuals to delicate formals. Billed transparently per kilogram or per garment.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Service 1 */}
          <div className="card-glass" style={{ padding: '2rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={handlePlaceOrderClick}>
            <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>🧺</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Wash & Fold</h3>
            <p style={{ color: '#888899', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              Daily clothes washed with gentle detergents, dried to perfection, and crisply folded.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <span style={{ color: '#FF6B00', fontWeight: 700, fontSize: '1.1rem' }}>Rs. 150 / kg</span>
              <span style={{ color: '#A0A0B0', fontSize: '0.8rem' }}>Order Now →</span>
            </div>
          </div>

          {/* Service 2 */}
          <div className="card-glass" style={{ padding: '2rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={handlePlaceOrderClick}>
            <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>👔</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Dry Cleaning</h3>
            <p style={{ color: '#888899', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              Special chemical solvent treatment designed for suits, blazers, silk sarees, and delicate fabrics.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <span style={{ color: '#FF6B00', fontWeight: 700, fontSize: '1.1rem' }}>From Rs. 400 / item</span>
              <span style={{ color: '#A0A0B0', fontSize: '0.8rem' }}>Order Now →</span>
            </div>
          </div>

          {/* Service 3 */}
          <div className="card-glass" style={{ padding: '2rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={handlePlaceOrderClick}>
            <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>💨</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Steam Press & Ironing</h3>
            <p style={{ color: '#888899', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              Commercial steam pressing delivering wrinkle-free sharp creases without fabric damage.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <span style={{ color: '#FF6B00', fontWeight: 700, fontSize: '1.1rem' }}>Rs. 80 / item</span>
              <span style={{ color: '#A0A0B0', fontSize: '0.8rem' }}>Order Now →</span>
            </div>
          </div>

          {/* Service 4 */}
          <div className="card-glass" style={{ padding: '2rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={handlePlaceOrderClick}>
            <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>24H Express Laundry</h3>
            <p style={{ color: '#888899', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              Urgent washing, drying, and packaging delivered back to your home within 24 hours.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <span style={{ color: '#FF6B00', fontWeight: 700, fontSize: '1.1rem' }}>Rs. 250 / kg</span>
              <span style={{ color: '#A0A0B0', fontSize: '0.8rem' }}>Order Now →</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{
        padding: '5rem 2rem',
        backgroundColor: '#0F101A',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Simple & Fast
          </p>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.5rem 0 3rem 0' }}>
            How SmartWash Pro Works
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 107, 0, 0.15)',
                color: '#FF6B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: '0 auto 1.25rem auto'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Book Your Order</h3>
              <p style={{ color: '#888899', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Click "Place Order", choose your laundry items, and select home pickup or drop-off at your nearest branch.
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: '0 auto 1.25rem auto'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>We Collect & Clean</h3>
              <p style={{ color: '#888899', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Our courier picks up your bag. Garments undergo professional washing, disinfection, and precision steaming.
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: '0 auto 1.25rem auto'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fresh Delivery</h3>
              <p style={{ color: '#888899', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Your packaged, crisp laundry arrives back at your doorstep. Track status and pay online or via cash on delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: '#07070C',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        color: '#707080',
        fontSize: '0.85rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <Logo size="small" />
        </div>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          Crystal Clean Laundry (Pvt) Ltd — SmartWash Pro Enterprise System
        </p>
        <p style={{ margin: 0, color: '#505060' }}>
          Strictly Role-Based Architecture: System Admin · Branch Manager Admin · Customer
        </p>
      </footer>

      {/* LOGIN MODAL (Pops up when clicking "Place An Order") */}
      {showLoginModal && (
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
          padding: '1rem'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', position: 'relative' }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: '#888899',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              <FiX />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '2rem' }}>🧺</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0.4rem 0' }}>
                Sign In to Place Order
              </h2>
              <p style={{ color: '#888899', fontSize: '0.85rem', margin: 0 }}>
                Please log in to your account or use quick demo customer login.
              </p>
            </div>

            {loginError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleModalLogin}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
                disabled={loginLoading}
              >
                {loginLoading ? 'Signing In...' : 'Sign In & Proceed to Order'}
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: '#888899' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#FF6B00', fontWeight: 600 }}>
                Register Free
              </Link>
            </div>

            {/* Quick Demo Customer Button */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: '0.75rem', color: '#707080', textAlign: 'center', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                One-Click Demo Customer
              </p>
              <button
                type="button"
                onClick={() => handleDemoLogin('cust@smartwash.com')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ADE80',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>🛒 Instant Demo Customer Login</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
