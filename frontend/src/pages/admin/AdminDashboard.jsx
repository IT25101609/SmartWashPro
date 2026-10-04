import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import Logo from '../../components/common/Logo';
import { 
  FiShield, FiUsers, FiDollarSign, FiShoppingBag, 
  FiPackage, FiSettings, FiPlus, FiArrowRight, FiCheckCircle, 
  FiClock, FiTrendingUp, FiMapPin, FiLayers
} from 'react-icons/fi';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#A0A0B0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading Islandwide System Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="alert alert-error" style={{ display: 'inline-block', maxWidth: '500px' }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const branchChartData = (data?.branchMetrics || []).map(b => ({
    name: b.branchName || b.branchCode,
    revenue: b.totalRevenue || 0,
    orders: b.totalOrders || 0
  }));

  return (
    <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(255, 107, 0, 0.03) 100%)',
        border: '1px solid rgba(255, 107, 0, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Logo size="large" />
          <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(255, 107, 0, 0.25)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ 
                background: '#FF6B00', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 700 
              }}>
                👑 SYSTEM ADMIN
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'white' }}>
                Islandwide System Overview
              </h1>
            </div>
            <p style={{ color: '#A0A0B0', margin: 0, fontSize: '0.9rem' }}>
              Centralized monitoring and governance across all SmartWash Pro operational branches.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/admin/branches')}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiPlus /> Manage Branches
          </button>
          <button 
            onClick={() => navigate('/admin/branch-managers')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiUsers /> Assign Managers
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '2rem' 
      }}>
        {/* Total Revenue */}
        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#888899', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
                Total Revenue
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FF6B00', margin: '0.4rem 0 0 0' }}>
                Rs. {(data?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255, 107, 0, 0.15)', 
              color: '#FF6B00', 
              padding: '10px', 
              borderRadius: '10px',
              fontSize: '1.2rem' 
            }}>
              <FiDollarSign />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiTrendingUp /> Islandwide gross across all branches
          </div>
        </div>

        {/* Total Branches */}
        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#888899', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
                Active Branches
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', margin: '0.4rem 0 0 0' }}>
                {data?.totalBranches || 0}
              </h3>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.15)', 
              color: '#3B82F6', 
              padding: '10px', 
              borderRadius: '10px',
              fontSize: '1.2rem' 
            }}>
              <FiMapPin />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#A0A0B0' }}>
            {data?.totalManagers || 0} Assigned Branch Managers
          </div>
        </div>

        {/* Total Orders */}
        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#888899', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
                Total Orders
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', margin: '0.4rem 0 0 0' }}>
                {data?.totalOrders || 0}
              </h3>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.15)', 
              color: '#22C55E', 
              padding: '10px', 
              borderRadius: '10px',
              fontSize: '1.2rem' 
            }}>
              <FiShoppingBag />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#A0A0B0' }}>
            {data?.completedOrders || 0} Delivered / {data?.pendingOrders || 0} In-Process
          </div>
        </div>

        {/* Registered Customers */}
        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#888899', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
                Customers
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', margin: '0.4rem 0 0 0' }}>
                {data?.totalCustomers || 0}
              </h3>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(168, 85, 247, 0.15)', 
              color: '#A855F7', 
              padding: '10px', 
              borderRadius: '10px',
              fontSize: '1.2rem' 
            }}>
              <FiUsers />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#A0A0B0' }}>
            Active customer accounts
          </div>
        </div>
      </div>

      {/* Middle Row: Branch Comparison Chart + Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Branch Revenue Chart */}
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Branch Revenue Comparison
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.8rem' }}>
                Revenue performance per branch
              </p>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Rs. LKR</span>
          </div>

          <div style={{ width: '100%', height: '240px' }}>
            {branchChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#707080" tick={{ fill: '#A0A0B0', fontSize: 12 }} />
                  <YAxis stroke="#707080" tick={{ fill: '#A0A0B0', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #FF6B00', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#FF6B00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#707080' }}>
                No branch revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Operational Assets Summary */}
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1.25rem' }}>
            System Infrastructure
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                  <FiSettings size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Total Commercial Equipment</div>
                  <div style={{ fontSize: '0.75rem', color: '#888899' }}>Washers, Dryers, Steamers across network</div>
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                {data?.totalEquipment || 0}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308' }}>
                  <FiPackage size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Inventory Catalog Items</div>
                  <div style={{ fontSize: '0.75rem', color: '#888899' }}>Detergents, Chemicals, Packaging stock</div>
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                {data?.totalInventory || 0}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
                  <FiCheckCircle size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Completed Deliveries</div>
                  <div style={{ fontSize: '0.75rem', color: '#888899' }}>Successfully completed and billed</div>
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22C55E' }}>
                {data?.completedOrders || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Performance Table */}
      <div className="card-glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
              Branch Operational Performance
            </h3>
            <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.8rem' }}>
              Real-time branch stats with strict multi-tenant boundary compliance
            </p>
          </div>
          <Link to="/admin/branches" style={{ color: '#FF6B00', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
            Manage All Branches <FiArrowRight />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Branch Name</th>
                <th>Assigned Manager</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.branchMetrics || []).length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#707080' }}>
                    No branches configured. Click "Manage Branches" to add one.
                  </td>
                </tr>
              ) : (
                data.branchMetrics.map(b => (
                  <tr key={b.id}>
                    <td>
                      <code style={{ background: 'rgba(255, 107, 0, 0.1)', color: '#FF6B00', padding: '2px 6px', borderRadius: '4px' }}>
                        {b.branchCode}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, color: '#FFFFFF' }}>
                      {b.branchName}
                    </td>
                    <td>
                      <div>
                        <div style={{ color: '#E0E0E0', fontSize: '0.9rem' }}>{b.managerName}</div>
                        <div style={{ color: '#707080', fontSize: '0.75rem' }}>{b.managerEmail}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{b.totalOrders}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#22C55E' }}>
                      Rs. {(b.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => navigate('/admin/branch-managers')}
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Manager Settings
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent System Orders */}
      <div className="card-glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
              Recent Orders Across Network
            </h3>
            <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.8rem' }}>
              Latest transaction activity across all branches
            </p>
          </div>
          <Link to="/orders" style={{ color: '#FF6B00', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
            View All Orders <FiArrowRight />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Branch</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders || []).length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#707080' }}>
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/orders/${o.id}`} style={{ color: '#FF6B00', fontWeight: 600 }}>
                        #{o.id}
                      </Link>
                    </td>
                    <td style={{ color: '#E0E0E0' }}>{o.customerName}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#A0A0B0' }}>
                        Branch #{o.branchId || 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>Rs. {(o.totalPrice || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        o.orderStatus === 'DELIVERED' ? 'badge-success' :
                        o.orderStatus === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td style={{ color: '#888899', fontSize: '0.8rem' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
