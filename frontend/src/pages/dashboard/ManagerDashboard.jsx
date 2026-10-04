import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FiDollarSign, FiShoppingBag, FiUsers, FiActivity,
  FiTrendingUp, FiClock, FiCheckCircle, FiAlertTriangle,
  FiTool, FiStar, FiArrowUpRight, FiPlus, FiTruck,
  FiPackage, FiChevronRight, FiLayers, FiRefreshCw,
  FiCreditCard, FiAlertCircle
} from 'react-icons/fi';
import api from '../../api/axios';
import Logo from '../../components/common/Logo';

const STATUS_COLORS = {
  PLACED: '#F59E0B',
  RECEIVED: '#3B82F6',
  ASSIGNED: '#8B5CF6',
  PROCESSING: '#06B6D4',
  IN_WASH: '#0284C7',
  READY: '#10B981',
  DELIVERED: '#22C55E',
  CANCELLED: '#EF4444'
};

const PIE_COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#6366F1'];

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartTab, setChartTab] = useState('revenue'); // 'revenue' | 'orders'
  const navigate = useNavigate();

  const loadData = useCallback((isSilent = false) => {
    if (!isSilent) {
      setRefreshing(true);
    }
    api.get('/dashboard/manager')
      .then(res => {
        setData(res.data);
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadData(false);

    // Auto-update dashboard numbers when underlying data changes (20s interval + window focus)
    const interval = setInterval(() => loadData(true), 20000);
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="loading" style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 44, height: 44, borderColor: 'rgba(255,107,0,0.2)', borderTopColor: '#FF6B00' }} />
        <p style={{ marginTop: 16, color: '#A0A0B0', fontSize: '0.9rem', fontWeight: 500 }}>Connecting live operational analytics...</p>
      </div>
    );
  }

  // 10 MANDATORY REAL DATABASE METRICS
  const todayOrders = Number(data?.todayOrders ?? 0);
  const pendingOrders = Number(data?.pendingOrders ?? 0);
  const completedOrders = Number(data?.completedOrders ?? 0);
  const todayRev = Number(data?.todayRevenue ?? 0);
  const pendingPayments = Number(data?.pendingPayments ?? data?.pendingPaymentsCount ?? 0);
  const pendingPaymentsAmount = Number(data?.pendingPaymentsAmount ?? 0);
  const pendingPickups = Number(data?.pendingPickups ?? 0);
  const pendingDeliveries = Number(data?.pendingDeliveries ?? 0);
  const lowStock = Number(data?.lowStockItems ?? 0);
  const complaints = Number(data?.openComplaints ?? 0);
  const brokenEquip = Number(data?.brokenEquipment ?? 0);

  // Auxiliary context metrics
  const totalRev = Number(data?.totalRevenue ?? 0);
  const totalOrders = Number(data?.totalOrders ?? 0);
  const processingOrders = Number(data?.processingOrders ?? 0);
  const totalCustomers = Number(data?.totalCustomers ?? 0);
  const totalEmployees = Number(data?.totalEmployees ?? 0);
  const maintDue = Number(data?.equipmentNeedingMaintenance ?? 0);
  const avgRating = Number(data?.averageRating ?? 0);

  // Format chart data using real database responses
  const pieData = (data?.orderStatusDistribution || []).map(item => ({
    name: item.status ? item.status.replace(/_/g, ' ') : 'Other',
    value: Number(item.count || 0),
  })).filter(item => item.value > 0);

  const monthlyData = (data?.monthlyOrders || []).map((item, i) => {
    const revObj = (data?.monthlyRevenue || [])[i];
    const revVal = revObj ? Number(revObj.amount ?? revObj.revenue ?? 0) : 0;
    return {
      month: item.month,
      orders: Number(item.count || 0),
      revenue: revVal,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* EXECUTIVE HERO BANNER */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Logo size="large" />
          <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(255, 107, 0, 0.25)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Branch Management Control Center
              </h1>
              <span className="badge badge-success" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                Live Database Connected
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Real-time telemetry across intake, laundry machinery, pickups, deliveries & revenue.
              {lastUpdated && <span style={{ marginLeft: 8, color: '#FF8C38', fontSize: '0.8rem' }}>• Synced at {lastUpdated}</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#E0E0E8',
              borderRadius: '10px',
              padding: '0.55rem 0.95rem',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Refresh Live Metrics"
          >
            <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Refreshing...' : 'Sync Live'}</span>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.15rem', fontSize: '0.88rem' }}
          >
            <FiShoppingBag size={16} />
            <span>Orders Desk</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PRIMARY FINANCIAL & VOLUME METRICS (4 CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
        
        {/* METRIC 1: TODAY'S REVENUE */}
        <div 
          className="stat-card"
          onClick={() => navigate('/payments')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#10B981'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div className="stat-card-header">
            <span className="stat-label">Today's Revenue</span>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiDollarSign size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Rs. {todayRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem', fontSize: '0.78rem' }}>
              <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <FiTrendingUp size={13} /> All-Time:
              </span>
              <span style={{ color: '#E0E0E8', fontWeight: 600 }}>Rs. {totalRev.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* METRIC 2: TODAY'S ORDERS */}
        <div 
          className="stat-card"
          onClick={() => navigate('/orders')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#FF6B00'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div className="stat-card-header">
            <span className="stat-label">Today's Orders</span>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              backgroundColor: 'rgba(255, 107, 0, 0.12)', color: '#FF6B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiShoppingBag size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {todayOrders} <span style={{ fontSize: '1rem', color: '#888899', fontWeight: 500 }}>orders today</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem', fontSize: '0.78rem' }}>
              <span style={{ color: '#FF8C38', fontWeight: 600 }}>Cumulative:</span>
              <span style={{ color: '#E0E0E8', fontWeight: 600 }}>{totalOrders} Total Orders</span>
            </div>
          </div>
        </div>

        {/* METRIC 3: PENDING ORDERS */}
        <div 
          className="stat-card"
          onClick={() => navigate('/orders')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#F59E0B'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div className="stat-card-header">
            <span className="stat-label">Pending Orders</span>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiClock size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {pendingOrders} <span style={{ fontSize: '1rem', color: '#F59E0B', fontWeight: 500 }}>awaiting</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem', fontSize: '0.78rem' }}>
              <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                {processingOrders} in production
              </span>
            </div>
          </div>
        </div>

        {/* METRIC 4: COMPLETED ORDERS */}
        <div 
          className="stat-card"
          onClick={() => navigate('/orders')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#3B82F6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div className="stat-card-header">
            <span className="stat-label">Completed Orders</span>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiCheckCircle size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {completedOrders} <span style={{ fontSize: '1rem', color: '#10B981', fontWeight: 500 }}>delivered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem', fontSize: '0.78rem' }}>
              <span style={{ color: '#10B981', fontWeight: 600 }}>✓ 100% Fulfilled</span>
              <span style={{ color: '#888899' }}>to satisfied clients</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: 6 CRITICAL OPERATIONAL DISPATCH & RESOURCE METRICS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiActivity style={{ color: '#FF6B00' }} />
            Operational Queue & Asset Telemetry
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#888899' }}>Live Database Status</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          {/* METRIC 5: PENDING PAYMENTS */}
          <div 
            onClick={() => navigate('/payments')}
            style={{
              backgroundColor: '#12131D',
              border: `1px solid ${pendingPayments > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              borderLeft: `4px solid ${pendingPayments > 0 ? '#F59E0B' : '#10B981'}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#12131D'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>Pending Payments</span>
              <FiCreditCard style={{ color: pendingPayments > 0 ? '#F59E0B' : '#10B981' }} size={16} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px 0' }}>
              {pendingPayments} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#888899' }}>unpaid</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#F59E0B', fontWeight: 500 }}>
              Rs. {pendingPaymentsAmount.toLocaleString()} to settle
            </div>
          </div>

          {/* METRIC 6: PENDING PICKUPS */}
          <div 
            onClick={() => navigate('/pickups')}
            style={{
              backgroundColor: '#12131D',
              border: `1px solid ${pendingPickups > 0 ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              borderLeft: `4px solid ${pendingPickups > 0 ? '#06B6D4' : '#10B981'}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#12131D'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>Pending Pickups</span>
              <FiTruck style={{ color: '#06B6D4' }} size={16} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px 0' }}>
              {pendingPickups} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#888899' }}>awaiting</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#06B6D4', fontWeight: 500 }}>
              {data?.todayPickups || 0} scheduled for today
            </div>
          </div>

          {/* METRIC 7: PENDING DELIVERIES */}
          <div 
            onClick={() => navigate('/deliveries')}
            style={{
              backgroundColor: '#12131D',
              border: `1px solid ${pendingDeliveries > 0 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              borderLeft: `4px solid ${pendingDeliveries > 0 ? '#8B5CF6' : '#10B981'}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#12131D'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>Pending Deliveries</span>
              <FiPackage style={{ color: '#8B5CF6' }} size={16} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px 0' }}>
              {pendingDeliveries} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#888899' }}>in queue</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#8B5CF6', fontWeight: 500 }}>
              {data?.todayDeliveries || 0} dispatch today
            </div>
          </div>

          {/* METRIC 8: LOW-STOCK ITEMS */}
          <div 
            onClick={() => navigate('/inventory')}
            style={{
              backgroundColor: '#12131D',
              border: `1px solid ${lowStock > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              borderLeft: `4px solid ${lowStock > 0 ? '#EF4444' : '#10B981'}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#12131D'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>Low-Stock Items</span>
              <FiLayers style={{ color: lowStock > 0 ? '#EF4444' : '#10B981' }} size={16} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px 0' }}>
              {lowStock} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#888899' }}>supplies</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: lowStock > 0 ? '#EF4444' : '#10B981', fontWeight: 500 }}>
              {lowStock > 0 ? 'Restock required' : 'Supplies optimal'}
            </div>
          </div>

          {/* METRIC 9: OPEN COMPLAINTS */}
          <div 
            onClick={() => navigate('/complaints')}
            style={{
              backgroundColor: '#12131D',
              border: `1px solid ${complaints > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              borderLeft: `4px solid ${complaints > 0 ? '#EF4444' : '#10B981'}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#12131D'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>Open Complaints</span>
              <FiAlertCircle style={{ color: complaints > 0 ? '#EF4444' : '#10B981' }} size={16} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px 0' }}>
              {complaints} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#888899' }}>cases</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: complaints > 0 ? '#EF4444' : '#10B981', fontWeight: 500 }}>
              {complaints > 0 ? 'Action required' : 'Zero complaints'}
            </div>
          </div>

          {/* METRIC 10: BROKEN EQUIPMENT */}
          <div 
            onClick={() => navigate('/breakdowns')}
            style={{
              backgroundColor: '#12131D',
              border: `1px solid ${brokenEquip > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              borderLeft: `4px solid ${brokenEquip > 0 ? '#EF4444' : '#10B981'}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#12131D'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>Broken Equipment</span>
              <FiTool style={{ color: brokenEquip > 0 ? '#EF4444' : '#10B981' }} size={16} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px 0' }}>
              {brokenEquip} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#888899' }}>broken</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: brokenEquip > 0 ? '#EF4444' : '#10B981', fontWeight: 500 }}>
              {maintDue > 0 ? `${maintDue} maintenance due` : 'Machinery operational'}
            </div>
          </div>

        </div>
      </div>

      {/* OPERATIONS WORKFLOW PIPELINE BAR */}
      <div style={{
        backgroundColor: '#12131D',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiActivity style={{ color: '#FF6B00' }} />
              Live Laundry Production Pipeline
            </h3>
            <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.78rem' }}>
              Current throughput across all washing, drying, folding, and delivery stages
            </p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            style={{
              background: 'none', border: 'none', color: '#FF6B00',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <span>Assign Staff Tasks</span>
            <FiChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          
          {/* Stage 1: Placed & Pending */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #F59E0B'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>1. Intake Pending</span>
              <FiClock style={{ color: '#F59E0B' }} size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0 0' }}>
              {pendingOrders}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>Awaiting inspection</span>
          </div>

          {/* Stage 2: Processing & Wash */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #06B6D4'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>2. Washing & Dry</span>
              <FiLayers style={{ color: '#06B6D4' }} size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0 0' }}>
              {processingOrders}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#06B6D4' }}>Machines running</span>
          </div>

          {/* Stage 3: Low Stock Alerts */}
          <div 
            onClick={() => navigate('/inventory')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${lowStock > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              borderLeft: `4px solid ${lowStock > 0 ? '#EF4444' : '#10B981'}`,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>3. Supplies State</span>
              <FiPackage style={{ color: lowStock > 0 ? '#EF4444' : '#10B981' }} size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0 0' }}>
              {lowStock} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#888899' }}>low items</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: lowStock > 0 ? '#EF4444' : '#10B981' }}>
              {lowStock > 0 ? 'Restock needed' : 'All stocks optimal'}
            </span>
          </div>

          {/* Stage 4: Completed Orders */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #10B981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888899', textTransform: 'uppercase' }}>4. Completed</span>
              <FiCheckCircle style={{ color: '#10B981' }} size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0 0' }}>
              {completedOrders}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#10B981' }}>Delivered to clients</span>
          </div>

        </div>
      </div>

      {/* ANALYTICS SECTION: REVENUE AREA CHART & STATUS DONUT CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        
        {/* REVENUE & ORDERS CHART */}
        <div style={{
          backgroundColor: '#12131D',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                {chartTab === 'revenue' ? '📈 Live Revenue Trend (Monthly)' : '📦 Live Monthly Order Volume'}
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.78rem' }}>
                Historical database trajectory for SmartWash Pro
              </p>
            </div>
            <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => setChartTab('revenue')}
                style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  backgroundColor: chartTab === 'revenue' ? '#FF6B00' : 'transparent',
                  color: chartTab === 'revenue' ? '#FFFFFF' : '#A0A0B0',
                  transition: 'all 0.15s ease'
                }}
              >
                Revenue (Rs.)
              </button>
              <button
                onClick={() => setChartTab('orders')}
                style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  backgroundColor: chartTab === 'orders' ? '#FF6B00' : 'transparent',
                  color: chartTab === 'orders' ? '#FFFFFF' : '#A0A0B0',
                  transition: 'all 0.15s ease'
                }}
              >
                Orders
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'revenue' ? (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="execRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" stroke="#656575" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#656575" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#161724', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: '0.82rem' }}
                    formatter={v => [`Rs. ${Number(v).toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF6B00" fill="url(#execRevenueGrad)" strokeWidth={2.5} />
                </AreaChart>
              ) : (
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" stroke="#656575" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#656575" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#161724', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: '0.82rem' }} />
                  <Bar dataKey="orders" fill="#FF6B00" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* ORDER STATUS DISTRIBUTION DONUT */}
        <div style={{
          backgroundColor: '#12131D',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
              📊 Batch Status Composition
            </h3>
            <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.78rem' }}>
              Live division of customer packages in database
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length ? pieData : [{ name: 'No Orders', value: 1 }]}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(pieData.length ? pieData : [{ name: 'None', value: 1 }]).map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={STATUS_COLORS[entry.name.toUpperCase().replace(/\s+/g, '_')] || PIE_COLORS[index % PIE_COLORS.length]} 
                      stroke="rgba(0,0,0,0.5)" 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#161724', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff' }}
                  formatter={(v, name) => [`${v} orders`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '0.25rem' }}>
            {pieData.slice(0, 6).map((p, i) => (
              <span key={i} style={{ fontSize: '0.75rem', color: '#A0A0B0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  backgroundColor: STATUS_COLORS[p.name.toUpperCase().replace(/\s+/g, '_')] || PIE_COLORS[i % PIE_COLORS.length] 
                }} />
                {p.name}: <strong>{p.value}</strong>
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* OPERATIONS ROW: RECENT ORDERS TABLE & CRITICAL ALERTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        
        {/* RECENT ORDERS TABLE */}
        <div style={{
          backgroundColor: '#12131D',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.4rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                📋 Real-Time Orders Stream
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.78rem' }}>
                Most recent client orders placed through intake
              </p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              style={{
                background: 'none', border: 'none', color: '#FF6B00',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              View All Orders ➔
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#707080' }}>ORDER</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#707080' }}>CUSTOMER</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#707080' }}>AMOUNT</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#707080' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders || []).slice(0, 5).map(o => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '10px', color: '#FF6B00', fontWeight: 700, fontSize: '0.85rem' }}>
                      #{o.id}
                    </td>
                    <td style={{ padding: '10px', color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem' }}>
                      {o.customer?.fullName || o.customerName || 'Walk-in Customer'}
                    </td>
                    <td style={{ padding: '10px', color: '#E0E0E8', fontWeight: 600, fontSize: '0.85rem' }}>
                      Rs. {(o.totalPrice || o.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: (STATUS_COLORS[o.orderStatus || o.status] || '#707080') + '22',
                        color: STATUS_COLORS[o.orderStatus || o.status] || '#E0E0E8',
                        border: `1px solid ${(STATUS_COLORS[o.orderStatus || o.status] || '#707080')}44`
                      }}>
                        {(o.orderStatus || o.status || 'PLACED').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!(data?.recentOrders?.length) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#707080', padding: '24px' }}>
                      No recent orders logged in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRITICAL ACTIONS & ALERTS PALETTE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Quick Manager Actions */}
          <div style={{
            backgroundColor: '#12131D',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1.25rem 1.4rem'
          }}>
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
              ⚡ Manager Command Center
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => navigate('/inventory')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.75rem', borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <FiPackage style={{ color: '#FF6B00' }} size={16} />
                <span>Restock Inventory</span>
              </button>

              <button
                onClick={() => navigate('/breakdowns')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.75rem', borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <FiTool style={{ color: '#EF4444' }} size={16} />
                <span>Machinery Repairs</span>
              </button>

              <button
                onClick={() => navigate('/employees')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.75rem', borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <FiUsers style={{ color: '#8B5CF6' }} size={16} />
                <span>Manage Staff</span>
              </button>

              <button
                onClick={() => navigate('/suppliers')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.75rem', borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <FiTruck style={{ color: '#10B981' }} size={16} />
                <span>Vendors & Supply</span>
              </button>
            </div>
          </div>

          {/* Operational Alerts Card */}
          <div style={{
            backgroundColor: '#12131D',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1.25rem 1.4rem',
            flex: 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiAlertTriangle style={{ color: (lowStock > 0 || maintDue > 0 || brokenEquip > 0 || complaints > 0) ? '#F59E0B' : '#10B981' }} size={16} />
                Critical Operational Alerts
              </h3>
              {(lowStock > 0 || maintDue > 0 || brokenEquip > 0 || complaints > 0) && (
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Action Required</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {brokenEquip > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>Broken Machinery Alert</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#EF4444' }}>{brokenEquip} equipment marked as BROKEN</p>
                  </div>
                  <button 
                    onClick={() => navigate('/breakdowns')}
                    style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px', backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Resolve
                  </button>
                </div>
              )}

              {lowStock > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>Low Stock Alert</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#EF4444' }}>{lowStock} items fell below minimum threshold</p>
                  </div>
                  <button 
                    onClick={() => navigate('/inventory')}
                    style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px', backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Restock
                  </button>
                </div>
              )}

              {maintDue > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>Machinery Service Due</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#F59E0B' }}>{maintDue} washers/dryers scheduled for inspection</p>
                  </div>
                  <button 
                    onClick={() => navigate('/maintenance')}
                    style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px', backgroundColor: '#F59E0B', color: '#161724', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    View
                  </button>
                </div>
              )}

              {complaints > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>Customer Complaints</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#EF4444' }}>{complaints} unresolved customer grievances</p>
                  </div>
                  <button 
                    onClick={() => navigate('/complaints')}
                    style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px', backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Investigate
                  </button>
                </div>
              )}

              {lowStock === 0 && maintDue === 0 && brokenEquip === 0 && complaints === 0 && (
                <div style={{
                  textAlign: 'center', padding: '16px', color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.06)', borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                  <FiCheckCircle size={22} style={{ marginBottom: 4 }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>All operational systems normal</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#888899' }}>Stock quantities healthy, machinery operational & zero open complaints</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
