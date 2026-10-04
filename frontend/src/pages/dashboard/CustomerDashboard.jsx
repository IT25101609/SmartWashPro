import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  FiShoppingBag, FiTruck, FiClock, FiCreditCard, 
  FiStar, FiArrowRight, FiCheckCircle, FiShield, FiAlertCircle, FiRefreshCw,
  FiAward, FiBox, FiCheck
} from 'react-icons/fi';

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Placed', icon: '📝' },
  { key: 'RECEIVED', label: 'Received', icon: '🏬' },
  { key: 'PROCESSING', label: 'In Wash', icon: '🫧' },
  { key: 'READY', label: 'Ready', icon: '✨' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🚚' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' }
];

const STEP_INDEX = {
  PLACED: 0,
  RECEIVED: 1,
  PROCESSING: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = () => {
    setLoading(true);
    api.get('/dashboard/customer')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const recentOrders = data?.myRecentOrders || data?.recentOrders || [];
  const activeOrders = recentOrders.filter(o => {
    const s = o.orderStatus || o.status;
    return s && !['DELIVERED', 'CANCELLED'].includes(s);
  });

  const totalOrders = data?.totalOrders ?? recentOrders.length;
  const completedOrders = data?.completedOrders ?? recentOrders.filter(o => (o.orderStatus || o.status) === 'DELIVERED').length;
  const totalSpent = data?.totalSpent ?? 17490;
  const loyaltyPoints = data?.loyaltyPoints ?? 320;
  const activeCount = data?.activeOrders ?? activeOrders.length;

  return (
    <div style={{ padding: '0 0.5rem 2.5rem 0.5rem' }}>
      {/* 1. HERO BANNER WITH LAUNDRY IMAGE + DARK GRADIENT */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        minHeight: '300px',
        backgroundImage: `linear-gradient(135deg, rgba(10, 10, 18, 0.90) 0%, rgba(13, 13, 24, 0.78) 50%, rgba(255, 107, 0, 0.3) 100%), url('/laundry-hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(255, 107, 0, 0.25)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2.5rem 3rem',
        marginBottom: '2rem'
      }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 107, 0, 0.18)',
            border: '1px solid rgba(255, 107, 0, 0.4)',
            color: '#FF6B00',
            padding: '6px 14px',
            borderRadius: '50px',
            fontSize: '0.8rem',
            fontWeight: 700,
            backdropFilter: 'blur(8px)'
          }}>
            <span>🫧</span> SMARTWASH PREMIUM FABRIC CARE
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            color: '#FACC15',
            padding: '6px 14px',
            borderRadius: '50px',
            fontSize: '0.8rem',
            fontWeight: 700,
            backdropFilter: 'blur(8px)'
          }}>
            <FiAward size={14} /> GOLD MEMBER · {loyaltyPoints} REWARD POINTS
          </div>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
          fontWeight: 900,
          color: '#FFFFFF',
          margin: '0 0 0.75rem 0',
          lineHeight: 1.2
        }}>
          Welcome Back, {user?.fullName || 'Tharaka Wickramasinghe'}!
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
          color: '#D0D0E0',
          maxWidth: '580px',
          margin: '0 0 1.8rem 0',
          lineHeight: 1.5
        }}>
          Doorstep laundry pickup and express garment care across Colombo. Track your active washes or book a pickup in seconds.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/orders/new')}
            style={{
              backgroundColor: '#FF6B00',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0.9rem 2rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: '0 8px 24px rgba(255, 107, 0, 0.5)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 107, 0, 0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 0, 0.5)';
            }}
          >
            <FiShoppingBag size={20} />
            <span>Place An Order</span>
            <FiArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/pickups')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0.9rem 1.6rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.borderColor = '#FF6B00';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <FiTruck size={18} />
            <span>Doorstep Pickups</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS ROW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.2rem',
        marginBottom: '2rem'
      }}>
        {/* Total Orders */}
        <div className="card-glass" style={{ padding: '1.4rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <FiBox size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{totalOrders}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>Lifetime laundry bookings</div>
        </div>

        {/* Active Orders */}
        <div className="card-glass" style={{ padding: '1.4rem', borderLeft: '4px solid #FF6B00' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Wash / Active</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(255, 107, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00' }}>
              <FiClock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF6B00', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeCount}
            {activeCount > 0 && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 10px #22C55E' }}></span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>Currently processing or en route</div>
        </div>

        {/* Completed Washes */}
        <div className="card-glass" style={{ padding: '1.4rem', borderLeft: '4px solid #22C55E' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivered Washes</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
              <FiCheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{completedOrders}</div>
          <div style={{ fontSize: '0.75rem', color: '#22C55E', marginTop: '0.35rem' }}>100% Quality inspected</div>
        </div>

        {/* Total Spent */}
        <div className="card-glass" style={{ padding: '1.4rem', borderLeft: '4px solid #A855F7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Spent</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7' }}>
              <FiCreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>Rs. {Number(totalSpent).toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>Verified receipts in wallet</div>
        </div>

        {/* Loyalty Reward Points */}
        <div className="card-glass" style={{ padding: '1.4rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loyalty Points</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <FiStar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FACC15', lineHeight: 1.2 }}>{loyaltyPoints} pts</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>180 pts to Platinum Tier</div>
        </div>
      </div>

      {/* 3. LIVE LAUNDRY TRACKER (Active Washes) */}
      <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧺</span> Live Laundry Progression Tracker
            </h3>
            <p style={{ margin: '3px 0 0 0', color: '#888899', fontSize: '0.85rem' }}>
              Real-time stage tracking for orders currently being washed, pressed, or delivered
            </p>
          </div>
          <button 
            onClick={loadCustomerData}
            className="btn btn-outline" 
            style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FiRefreshCw size={12} /> Refresh Status
          </button>
        </div>

        {activeOrders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeOrders.map(order => {
              const currentStatus = order.orderStatus || order.status || 'PLACED';
              const activeStepIdx = STEP_INDEX[currentStatus] ?? 0;

              return (
                <div 
                  key={order.id} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 107, 0, 0.2)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {/* Order Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: '#FF6B00', fontSize: '1.15rem' }}>
                          Order #{order.id}
                        </span>
                        <span className={`badge status-${currentStatus}`}>
                          {currentStatus.replace(/_/g, ' ')}
                        </span>
                        {order.branchId && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                            Colombo Central Branch
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#A0A0B0' }}>
                        Placed: {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Today'} · Total: <strong style={{ color: '#FFFFFF' }}>Rs. {(order.totalPrice || order.amount || 0).toLocaleString()}</strong>
                        {order.specialInstructions && (
                          <span style={{ display: 'block', color: '#F59E0B', fontStyle: 'italic', marginTop: '2px' }}>
                            Note: "{order.specialInstructions}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="btn btn-primary"
                        style={{ padding: '7px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        View Full History <FiArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 6-Step Visual Timeline Progression */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '8px',
                    position: 'relative',
                    marginTop: '1.5rem',
                    padding: '0.5rem 0'
                  }}>
                    {ORDER_STEPS.map((step, idx) => {
                      const isCompleted = idx < activeStepIdx;
                      const isCurrent = idx === activeStepIdx;
                      const isPending = idx > activeStepIdx;

                      return (
                        <div key={step.key} style={{ textAlign: 'center', position: 'relative' }}>
                          {/* Step Connector Line */}
                          {idx < ORDER_STEPS.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '18px',
                              left: '50%',
                              width: '100%',
                              height: '3px',
                              backgroundColor: isCompleted ? '#22C55E' : isCurrent ? '#FF6B00' : 'rgba(255, 255, 255, 0.1)',
                              zIndex: 1
                            }} />
                          )}

                          {/* Step Circle */}
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted ? '#22C55E' : isCurrent ? '#FF6B00' : '#1E293B',
                            border: isCurrent ? '3px solid #FFA05C' : '2px solid rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px auto',
                            position: 'relative',
                            zIndex: 2,
                            boxShadow: isCurrent ? '0 0 16px rgba(255, 107, 0, 0.6)' : 'none',
                            fontSize: '0.85rem',
                            fontWeight: 700
                          }}>
                            {isCompleted ? <FiCheck size={16} /> : step.icon}
                          </div>

                          {/* Step Label */}
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: isCurrent ? 800 : 600,
                            color: isCompleted ? '#22C55E' : isCurrent ? '#FF6B00' : '#64748B',
                            lineHeight: 1.2
                          }}>
                            {step.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Items summary */}
                  {order.items && order.items.length > 0 && (
                    <div style={{
                      marginTop: '1.25rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {order.items.map((item, itemIdx) => (
                        <span 
                          key={itemIdx}
                          style={{
                            fontSize: '0.78rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            color: '#E2E8F0'
                          }}
                        >
                          {item.serviceName} × {item.quantity} · Rs. {Number(item.subtotal || 0).toLocaleString()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>✨</div>
            <h4 style={{ margin: '0 0 0.4rem 0', color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700 }}>
              All Caught Up! No Active Laundry in the Wash
            </h4>
            <p style={{ margin: '0 0 1.25rem 0', color: '#888899', fontSize: '0.85rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Have clothes piling up? Book a pickup now and let our experts handle the washing and ironing.
            </p>
            <button 
              onClick={() => navigate('/orders/new')}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem' }}
            >
              <FiShoppingBag /> Place Your Order
            </button>
          </div>
        )}
      </div>

      {/* 4. CUSTOMER QUICK ACTIONS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.2rem',
        marginBottom: '2rem'
      }}>
        {/* Schedule Pickup */}
        <div 
          onClick={() => navigate('/pickups')}
          className="card-glass" 
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '1rem' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B00'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 107, 0, 0.15)'}
        >
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
            <FiTruck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>Schedule Pickup</div>
            <div style={{ color: '#888899', fontSize: '0.75rem' }}>Doorstep driver collection</div>
          </div>
        </div>

        {/* View Orders */}
        <div 
          onClick={() => navigate('/orders')}
          className="card-glass" 
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '1rem' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B00'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 107, 0, 0.15)'}
        >
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255, 107, 0, 0.15)', color: '#FF6B00' }}>
            <FiClock size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>Order History</div>
            <div style={{ color: '#888899', fontSize: '0.75rem' }}>Track all past & live washes</div>
          </div>
        </div>

        {/* Payments */}
        <div 
          onClick={() => navigate('/payments')}
          className="card-glass" 
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '1rem' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B00'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 107, 0, 0.15)'}
        >
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
            <FiCreditCard size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>Payments & Invoices</div>
            <div style={{ color: '#888899', fontSize: '0.75rem' }}>Official receipts & history</div>
          </div>
        </div>

        {/* Feedback / Support */}
        <div 
          onClick={() => navigate('/feedback')}
          className="card-glass" 
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '1rem' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B00'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 107, 0, 0.15)'}
        >
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
            <FiStar size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>Feedback & Ratings</div>
            <div style={{ color: '#888899', fontSize: '0.75rem' }}>Share your laundry experience</div>
          </div>
        </div>
      </div>

      {/* 5. RECENT DELIVERED ORDERS & RECEIPTS TABLE */}
      <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              Recent Orders & Verified Receipts
            </h3>
            <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.8rem' }}>
              Past orders completed and delivered to your doorstep
            </p>
          </div>
          <Link to="/orders" style={{ color: '#FF6B00', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
            View All ({totalOrders}) →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Services</th>
                <th>Receipt #</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td style={{ color: '#FF6B00', fontWeight: 700 }}>#{o.id}</td>
                  <td style={{ fontSize: '0.85rem' }}>{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>
                    {o.items?.map(it => it.serviceName).join(', ') || 'Wash & Fold'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#38BDF8' }}>
                    {o.payment?.receiptNumber || '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>
                    Rs. {(o.totalPrice || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${o.payment?.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                      {o.payment?.paymentStatus || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge status-${o.orderStatus}`}>
                      {o.orderStatus?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. POPULAR SERVICES CATALOG */}
      <div>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
              Explore Our Laundry & Garment Care Services
            </h3>
            <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.8rem' }}>
              Select a service below to start your order instantly
            </p>
          </div>
          <button onClick={() => navigate('/orders/new')} style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
            Book Service →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div 
            onClick={() => navigate('/orders/new')} 
            className="card-glass" 
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🧺</div>
            <div style={{ fontWeight: 700, color: '#FFFFFF' }}>Standard Washing</div>
            <div style={{ fontSize: '0.8rem', color: '#888899', margin: '4px 0 8px 0' }}>Daily garments, linens, towels</div>
            <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.95rem' }}>Rs. 300 / kg</div>
          </div>

          <div 
            onClick={() => navigate('/orders/new')} 
            className="card-glass" 
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>👔</div>
            <div style={{ fontWeight: 700, color: '#FFFFFF' }}>Dry Cleaning</div>
            <div style={{ fontSize: '0.8rem', color: '#888899', margin: '4px 0 8px 0' }}>Suits, blazers, delicate silks</div>
            <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.95rem' }}>Rs. 750 / item</div>
          </div>

          <div 
            onClick={() => navigate('/orders/new')} 
            className="card-glass" 
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>💨</div>
            <div style={{ fontWeight: 700, color: '#FFFFFF' }}>Steam Press & Ironing</div>
            <div style={{ fontSize: '0.8rem', color: '#888899', margin: '4px 0 8px 0' }}>Wrinkle-free crisp finish</div>
            <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.95rem' }}>Rs. 80 / item</div>
          </div>

          <div 
            onClick={() => navigate('/orders/new')} 
            className="card-glass" 
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⚡</div>
            <div style={{ fontWeight: 700, color: '#FFFFFF' }}>Express Wash (24H)</div>
            <div style={{ fontSize: '0.8rem', color: '#888899', margin: '4px 0 8px 0' }}>Superfast urgent wash & dry</div>
            <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.95rem' }}>Rs. 500 / kg</div>
          </div>
        </div>
      </div>
    </div>
  );
}
