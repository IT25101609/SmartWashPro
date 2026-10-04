import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FiBarChart2, FiTrendingUp, FiDollarSign, FiShoppingBag,
  FiPackage, FiUsers, FiDownload, FiPrinter, FiRefreshCw,
  FiCalendar, FiLayers, FiAlertTriangle, FiCheckCircle, FiClock,
  FiTruck, FiAlertOctagon, FiFilter, FiSearch, FiXCircle,
  FiArrowUpRight, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import reportService from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

const CHART_PALETTE = ['#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#6366F1'];

const REPORT_CATEGORIES = [
  { id: 'DAILY_ORDERS', label: 'Daily Orders', icon: FiCalendar, color: '#FF6B00', desc: 'Day-by-day batch flow, intake volumes, and generated amounts' },
  { id: 'MONTHLY_ORDERS', label: 'Monthly Orders', icon: FiBarChart2, color: '#3B82F6', desc: 'Aggregated monthly order quantities, revenue, and trends' },
  { id: 'REVENUE', label: 'Revenue Analysis', icon: FiTrendingUp, color: '#10B981', desc: 'Cashflow analysis across paid, invoiced, and gross totals' },
  { id: 'PAYMENTS', label: 'Payments & Settlements', icon: FiDollarSign, color: '#F59E0B', desc: 'Method breakdown, verified receipts, and outstanding amounts' },
  { id: 'INVENTORY', label: 'Inventory & Valuation', icon: FiPackage, color: '#8B5CF6', desc: 'Asset valuation, stock quantities, and SKU categories' },
  { id: 'LOW_STOCK', label: 'Low Stock Reorder', icon: FiAlertTriangle, color: '#EF4444', desc: 'Critical inventory deficits requiring supplier procurement' },
  { id: 'CUSTOMERS', label: 'Customer Intelligence', icon: FiUsers, color: '#06B6D4', desc: 'Customer lifetime values, order history, and top accounts' },
  { id: 'SERVICES', label: 'Services Performance', icon: FiLayers, color: '#EC4899', desc: 'Popularity and revenue generation by wash and fold tier' },
  { id: 'EMPLOYEE_ATTENDANCE', label: 'Staff Attendance', icon: FiClock, color: '#6366F1', desc: 'Daily punch logs, shift punctuality, and attendance ratios' },
  { id: 'PICKUPS', label: 'Pickups Fulfillment', icon: FiTruck, color: '#14B8A6', desc: 'Scheduled pickups, driver assignments, and transit status' },
  { id: 'DELIVERIES', label: 'Deliveries Dispatch', icon: FiCheckCircle, color: '#F97316', desc: 'Delivery routing, completed drops, and cash collection' },
  { id: 'COMPLAINTS', label: 'Customer Complaints', icon: FiAlertOctagon, color: '#E11D48', desc: 'Open tickets, resolution turnaround, and root causes' }
];

export default function ReportsPage() {
  // Current Selected Report
  const [selectedType, setSelectedType] = useState('DAILY_ORDERS');

  // Metadata for filter dropdowns
  const [meta, setMeta] = useState({
    branches: [],
    employees: [],
    services: [],
    orderStatuses: [],
    paymentStatuses: [],
    attendanceStatuses: [],
    pickupStatuses: [],
    deliveryStatuses: [],
    complaintStatuses: [],
    inventoryCategories: []
  });

  const { user, isAdmin } = useAuth();
  const initialBranchId = isAdmin ? '' : (user?.branchId ? String(user.branchId) : '');

  // 6 Filter States
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [branchId, setBranchId] = useState(initialBranchId);
  const [status, setStatus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [serviceId, setServiceId] = useState('');

  // Sync branchId if user loads asynchronously
  useEffect(() => {
    if (!isAdmin && user?.branchId) {
      setBranchId(String(user.branchId));
    }
  }, [isAdmin, user]);

  // Table Search and Pagination
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  // Report Data
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Load Meta Dropdowns on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await reportService.getMeta();
        if (res.data) {
          setMeta(res.data);
        }
      } catch (err) {
        console.error('Failed to load filters metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Report Data whenever report type or filters change
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const effBranch = isAdmin ? (branchId || undefined) : (user?.branchId ? String(user.branchId) : (branchId || undefined));
      const params = {
        type: selectedType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: effBranch,
        status: status || undefined,
        employeeId: employeeId || undefined,
        serviceId: serviceId || undefined
      };
      const res = await reportService.getReportData(params);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load report data:', err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [selectedType, startDate, endDate, branchId, status, employeeId, serviceId, isAdmin, user]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Reset filters
  const handleResetFilters = () => {
    setStartDate(thirtyDaysAgoStr);
    setEndDate(todayStr);
    setBranchId(isAdmin ? '' : (user?.branchId ? String(user.branchId) : ''));
    setStatus('');
    setEmployeeId('');
    setServiceId('');
    setTableSearch('');
  };

  // Quick Date Range Presets
  const applyDatePreset = (preset) => {
    const today = new Date();
    const tStr = today.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      setStartDate(tStr);
      setEndDate(tStr);
    } else if (preset === '7DAYS') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(tStr);
    } else if (preset === '30DAYS') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(tStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(tStr);
    } else if (preset === 'THIS_YEAR') {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      setStartDate(firstDayOfYear.toISOString().split('T')[0]);
      setEndDate(tStr);
    }
  };

  // Status options dynamically resolved based on current report type
  const currentStatusOptions = useMemo(() => {
    switch (selectedType) {
      case 'DAILY_ORDERS':
      case 'MONTHLY_ORDERS':
      case 'REVENUE':
        return meta.orderStatuses || [];
      case 'PAYMENTS':
        return meta.paymentStatuses || [];
      case 'INVENTORY':
      case 'LOW_STOCK':
        return meta.inventoryCategories || [];
      case 'EMPLOYEE_ATTENDANCE':
        return meta.attendanceStatuses || [];
      case 'PICKUPS':
        return meta.pickupStatuses || [];
      case 'DELIVERIES':
        return meta.deliveryStatuses || [];
      case 'COMPLAINTS':
        return meta.complaintStatuses || [];
      default:
        return [];
    }
  }, [selectedType, meta]);

  // Handle Export CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const effBranch = isAdmin ? (branchId || undefined) : (user?.branchId ? String(user.branchId) : (branchId || undefined));
      const params = {
        type: selectedType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: effBranch,
        status: status || undefined,
        employeeId: employeeId || undefined,
        serviceId: serviceId || undefined
      };
      const res = await reportService.exportReportCsv(params);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SmartWash_${selectedType}_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report successfully exported to CSV');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  // Filter Table Records by Search
  const filteredRecords = useMemo(() => {
    if (!reportData?.records) return [];
    if (!tableSearch.trim()) return reportData.records;
    const term = tableSearch.toLowerCase();
    return reportData.records.filter(row =>
      Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(term))
    );
  }, [reportData?.records, tableSearch]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, page, rowsPerPage]);

  const activeCategory = REPORT_CATEGORIES.find(c => c.id === selectedType) || REPORT_CATEGORIES[0];
  const CategoryIcon = activeCategory.icon;

  // Chart Rendering Helper: Automatically determines best visualization type
  const renderChart = () => {
    const chartData = reportData?.chartData;
    if (!chartData || chartData.length === 0) {
      return (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#656575' }}>
          No chart data available for the selected filters
        </div>
      );
    }

    const sample = chartData[0];

    // Case 1: Time Series / Trend with multiple dates (Area Chart)
    if ('date' in sample || 'month' in sample) {
      const xKey = 'date' in sample ? 'date' : 'month';
      const hasRevenue = 'revenue' in sample;
      const hasOrders = 'orders' in sample;
      const hasInvoiced = 'invoicedOrders' in sample;
      const hasNewCustomers = 'newCustomers' in sample;

      return (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeCategory.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={activeCategory.color} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="secondaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey={xKey} stroke="#656575" tick={{ fontSize: 11 }} />
            <YAxis stroke="#656575" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#161724', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff' }}
              formatter={(val, name) => [
                name === 'revenue' || name === 'spend' ? `Rs. ${Number(val).toLocaleString()}` : val,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
            />
            <Legend formatter={(val) => <span style={{ color: '#A0A0B0', fontSize: 11 }}>{val}</span>} />
            {hasRevenue && (
              <Area type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke={activeCategory.color} fill="url(#primaryAreaGrad)" strokeWidth={2.5} />
            )}
            {hasOrders && (
              <Area type="monotone" dataKey="orders" name="Order Batches" stroke="#3B82F6" fill="url(#secondaryAreaGrad)" strokeWidth={2} />
            )}
            {hasInvoiced && !hasOrders && (
              <Area type="monotone" dataKey="invoicedOrders" name="Orders" stroke="#10B981" fill="url(#secondaryAreaGrad)" strokeWidth={2} />
            )}
            {hasNewCustomers && (
              <Area type="monotone" dataKey="newCustomers" name="New Customers" stroke="#06B6D4" fill="url(#secondaryAreaGrad)" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Case 2: Distribution / Categorical Pie Chart (name & count / value)
    if ('name' in sample && ('count' in sample || 'value' in sample)) {
      const dataKey = 'value' in sample && sample.value > 0 ? 'value' : 'count';
      return (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={4}
              dataKey={dataKey}
              nameKey="name"
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} stroke="rgba(0,0,0,0.4)" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#161724', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff' }}
              formatter={(val, name) => [
                dataKey === 'value' ? `Rs. ${Number(val).toLocaleString()}` : val,
                name
              ]}
            />
            <Legend formatter={(val) => <span style={{ color: '#A0A0B0', fontSize: 12 }}>{val}</span>} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Case 3: Categorical Bar Chart (e.g. Services, Inventory Categories, Low Stock)
    const categoryKey = 'category' in sample ? 'category' : ('serviceName' in sample ? 'serviceName' : ('itemName' in sample ? 'itemName' : Object.keys(sample)[0]));
    const valKey = 'revenue' in sample ? 'revenue' : ('valuation' in sample ? 'valuation' : ('deficit' in sample ? 'deficit' : ('ordersCount' in sample ? 'ordersCount' : ('count' in sample ? 'count' : Object.keys(sample)[1]))));

    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey={categoryKey} stroke="#656575" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis stroke="#656575" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#161724', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff' }}
            formatter={(val, name) => [
              name.toLowerCase().includes('revenue') || name.toLowerCase().includes('valuation') || name.toLowerCase().includes('cost')
                ? `Rs. ${Number(val).toLocaleString()}`
                : val,
              name
            ]}
          />
          <Bar dataKey={valKey} name={valKey.toUpperCase()} fill={activeCategory.color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1480px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BAR */}
      {/* ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(18, 19, 28, 0.95) 100%)',
        border: '1px solid rgba(255, 107, 0, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: `${activeCategory.color}20`,
            border: `1px solid ${activeCategory.color}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeCategory.color
          }}>
            <CategoryIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                {reportData?.title || activeCategory.label}
              </h1>
              <span style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '20px',
                padding: '2px 9px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                ● Live Database Intelligence
              </span>
            </div>
            <p style={{ color: '#9090A5', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              {reportData?.description || activeCategory.desc}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#E0E0E8',
              borderRadius: '8px',
              padding: '0.55rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            title="Refresh Report Data"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60A5FA',
              borderRadius: '8px',
              padding: '0.55rem 0.95rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: exporting ? 'not-allowed' : 'pointer'
            }}
          >
            <FiDownload size={14} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem', fontSize: '0.82rem' }}
          >
            <FiPrinter size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 12-REPORT CATEGORY SELECTOR CAROUSEL / GRID */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '8px',
        backgroundColor: '#10111A',
        padding: '10px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {REPORT_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 6px',
                borderRadius: '10px',
                backgroundColor: isSelected ? `${cat.color}25` : 'rgba(255, 255, 255, 0.02)',
                border: isSelected ? `2px solid ${cat.color}` : '1px solid rgba(255, 255, 255, 0.06)',
                color: isSelected ? '#FFFFFF' : '#8E8E9E',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                gap: '6px'
              }}
            >
              <Icon size={18} style={{ color: isSelected ? cat.color : '#8E8E9E' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 500, textAlign: 'center', lineHeight: '1.1' }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. 6 FILTERS CONTROL BAR & QUICK DATE PRESETS */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FF6B00', fontWeight: 700, fontSize: '0.9rem' }}>
            <FiFilter size={16} />
            <span>Dynamic Query Filters</span>
          </div>

          {/* Quick Date Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#888899', marginRight: '4px' }}>Presets:</span>
            {[
              { id: 'TODAY', label: 'Today' },
              { id: '7DAYS', label: 'Last 7 Days' },
              { id: '30DAYS', label: 'Last 30 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'THIS_YEAR', label: 'This Year' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => applyDatePreset(p.id)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#C0C0D0',
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={handleResetFilters}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#EF4444',
                fontSize: '0.72rem',
                padding: '4px 8px',
                cursor: 'pointer',
                marginLeft: '4px'
              }}
            >
              Reset All
            </button>
          </div>
        </div>

        {/* The 6 Required Filter Inputs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          {/* 1. From Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#A0A0B0', marginBottom: '4px' }}>From Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          {/* 2. To Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#A0A0B0', marginBottom: '4px' }}>To Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          {/* 3. Branch Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#A0A0B0', marginBottom: '4px' }}>Branch</label>
            {isAdmin ? (
              <select
                className="form-control"
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="">All Branches</option>
                {meta.branches?.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="form-control"
                value={user?.branchId || branchId}
                disabled
                style={{
                  width: '100%',
                  fontSize: '0.82rem',
                  opacity: 0.85,
                  cursor: 'not-allowed',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#FF6B00',
                  fontWeight: 600
                }}
              >
                {meta.branches?.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
                {(!meta.branches || meta.branches.length === 0) && (
                  <option value={user?.branchId}>Branch #{user?.branchId}</option>
                )}
              </select>
            )}
          </div>

          {/* 4. Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#A0A0B0', marginBottom: '4px' }}>Status</label>
            <select
              className="form-control"
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              <option value="">All Statuses</option>
              {currentStatusOptions.map(st => (
                <option key={st} value={st}>
                  {st.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Employee Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#A0A0B0', marginBottom: '4px' }}>Employee</label>
            <select
              className="form-control"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              <option value="">All Employees</option>
              {meta.employees?.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role?.replace(/_/g, ' ') || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {/* 6. Service Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#A0A0B0', marginBottom: '4px' }}>Service</label>
            <select
              className="form-control"
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              <option value="">All Services</option>
              {meta.services?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Rs. {s.price})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SUMMARY KPI METRIC TILES (DYNAMIC FROM BACKEND) */}
      {/* ========================================================================= */}
      {loading ? (
        <div style={{ minHeight: '30vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderColor: 'rgba(255,107,0,0.2)', borderTopColor: '#FF6B00' }} />
          <p style={{ marginTop: 14, color: '#A0A0B0', fontSize: '0.88rem' }}>Generating live database calculation...</p>
        </div>
      ) : (
        <>
          {reportData?.summary && Object.keys(reportData.summary).length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1.25rem'
            }}>
              {Object.entries(reportData.summary).map(([key, value], idx) => {
                const formattedLabel = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .replace(/Rs$/, '(Rs.)');

                let displayVal = value;
                if (typeof value === 'number') {
                  displayVal = key.toLowerCase().includes('revenue') || key.toLowerCase().includes('valuation') || key.toLowerCase().includes('spend') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('budget')
                    ? `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : value.toLocaleString();
                }

                const tileColors = ['#10B981', '#FF6B00', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4'];
                const cardColor = tileColors[idx % tileColors.length];

                return (
                  <div key={key} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${cardColor}` }}>
                    <div style={{ color: '#888899', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      {formattedLabel}
                    </div>
                    <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {displayVal !== null && displayVal !== undefined ? String(displayVal) : '0'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. LIVE RECHARTS VISUALIZATION CARD */}
          {/* ========================================================================= */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#FFFFFF' }}>
                  📊 Analytics Visualization: {reportData?.title}
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.78rem' }}>
                  Live aggregate metrics rendered directly from MySQL transactional records
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>
                Total Records: <strong style={{ color: '#FF6B00' }}>{reportData?.totalRecords ?? filteredRecords.length}</strong>
              </span>
            </div>

            <div style={{ width: '100%' }}>
              {renderChart()}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. DETAILED DATA TABLE WITH SEARCH & PAGINATION */}
          {/* ========================================================================= */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#FFFFFF' }}>
                  📋 Detailed Report Records
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#888899', fontSize: '0.78rem' }}>
                  Showing {filteredRecords.length} of {reportData?.records?.length || 0} entries
                </p>
              </div>

              {/* Instant Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#656575' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Quick search records..."
                  value={tableSearch}
                  onChange={e => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  style={{ paddingLeft: '32px', width: '100%', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Table Container */}
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {reportData?.columns?.map(col => (
                      <th key={col.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', color: '#888899', fontWeight: 600 }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background-color 0.15s ease' }}>
                        {reportData?.columns?.map(col => {
                          const val = row[col.key];

                          // Custom render for Status pills
                          if (col.key === 'status') {
                            const isGreen = ['DELIVERED', 'PAID', 'COMPLETED', 'PRESENT', 'ACTIVE', 'RESOLVED'].includes(val);
                            const isOrange = ['IN_PROGRESS', 'PROCESSING', 'SCHEDULED', 'ASSIGNED', 'COLLECTED'].includes(val);
                            const isRed = ['CANCELLED', 'FAILED', 'BROKEN', 'ABSENT', 'LATE', 'CRITICAL', 'LOW', 'DEFICIT'].includes(val);

                            return (
                              <td key={col.key} style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
                                <span className={`badge ${isGreen ? 'badge-success' : isOrange ? 'badge-warning' : isRed ? 'badge-error' : 'badge-neutral'}`}>
                                  {val || '-'}
                                </span>
                              </td>
                            );
                          }

                          // Custom render for Money / Amount
                          if (typeof val === 'string' && val.startsWith('Rs.')) {
                            return (
                              <td key={col.key} style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#10B981' }}>
                                {val}
                              </td>
                            );
                          }

                          // Custom render for Order or ID badge
                          if (col.key.toLowerCase().includes('id') || col.key === 'receiptNumber') {
                            return (
                              <td key={col.key} style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#FF6B00' }}>
                                {val || '-'}
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#E0E0E8' }}>
                              {val !== null && val !== undefined ? String(val) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={reportData?.columns?.length || 1} style={{ textAlign: 'center', padding: '2.5rem', color: '#656575' }}>
                        No records match the selected filters and search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.8rem', color: '#888899' }}>
                  Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: page === 1 ? '#555566' : '#FFFFFF',
                      cursor: page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          borderRadius: '6px',
                          backgroundColor: page === pageNum ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                          border: page === pageNum ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.1)',
                          color: '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: page === totalPages ? '#555566' : '#FFFFFF',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
