import React, { useEffect, useState, useMemo, useCallback } from 'react';
import feedbackService from '../../services/feedbackService';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FiStar, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSearch, 
  FiCheckCircle, FiAlertCircle, FiX, FiCalendar, FiFilter,
  FiShoppingBag, FiUser, FiAward, FiMessageSquare
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const InteractiveStars = ({ rating, onSelect, hoverRating, setHoverRating, size = 28 }) => {
  const current = hoverRating || rating || 5;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onSelect && onSelect(star)}
            onMouseEnter={() => setHoverRating && setHoverRating(star)}
            onMouseLeave={() => setHoverRating && setHoverRating(0)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: onSelect ? 'pointer' : 'default',
              color: star <= current ? '#FACC15' : '#475569',
              fontSize: `${size}px`,
              lineHeight: 1,
              transition: 'transform 0.1s ease, color 0.15s ease',
              transform: star <= current ? 'scale(1.1)' : 'scale(1.0)'
            }}
          >
            ★
          </button>
        ))}
      </div>
      <span style={{ 
        color: '#FACC15', 
        fontWeight: 700, 
        fontSize: '0.95rem',
        minWidth: '80px' 
      }}>
        {RATING_LABELS[current] || ''} ({current}/5)
      </span>
    </div>
  );
};

const DisplayStars = ({ rating, size = '1.15rem' }) => (
  <div style={{ display: 'inline-flex', gap: '2px', color: '#FACC15', fontSize: size }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star}>{star <= rating ? '★' : '☆'}</span>
    ))}
  </div>
);

const F = ({ label, required, children }) => (
  <div className="form-group" style={{ marginBottom: '1.1rem' }}>
    <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    {children}
  </div>
);

export default function FeedbackPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER';
  const isCustomer = user?.role === 'CUSTOMER';
  const canManageAll = isAdmin || isManager;

  // Feedback Data & Stats
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [activeTab, setActiveTab] = useState(isCustomer ? 'my' : 'all'); // 'all' | 'my'
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals & Forms
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Submission Form State
  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    rating: 5,
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    rating: 5,
    comment: ''
  });
  const [editHoverRating, setEditHoverRating] = useState(0);

  // Eligible Orders & Customer Data for Submission
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);

  // Load Feedback Data
  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        size: 100
      };

      if (ratingFilter !== 'ALL') {
        params.rating = parseInt(ratingFilter, 10);
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      if (dateFilter) {
        params.date = dateFilter;
      }
      if (activeTab === 'my' && isCustomer) {
        params.myOnly = true;
      }

      const res = (activeTab === 'my' && isCustomer) 
        ? await feedbackService.getMyFeedback(params)
        : await feedbackService.getFeedback(params);

      setFeedbackList(res.content || []);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      toast.error('Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  }, [ratingFilter, search, dateFilter, activeTab, isCustomer]);

  // Load Global Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await feedbackService.getFeedbackStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load feedback stats:', err);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Fetch Customers when manager opens modal
  const loadCustomers = async () => {
    if (!canManageAll) return;
    try {
      const res = await api.get('/customers', { params: { size: 100 } });
      setCustomerOptions(res.data?.content || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  // Fetch Eligible Completed Orders
  const loadEligibleOrders = async (targetCustomerId = null) => {
    setLoadingOrders(true);
    try {
      const params = {};
      if (targetCustomerId) {
        params.customerId = targetCustomerId;
      }
      const orders = await feedbackService.getEligibleOrders(params);
      setEligibleOrders(orders || []);
      // If only one eligible order, pre-select it
      if (orders && orders.length === 1) {
        setForm(prev => ({ ...prev, orderId: orders[0].orderId }));
      }
    } catch (err) {
      console.error('Failed to load eligible orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Modal Open Handlers
  const openCreateModal = () => {
    setForm({
      customerId: '',
      orderId: '',
      rating: 5,
      comment: ''
    });
    setHoverRating(0);
    setError('');
    setModal('create');

    if (canManageAll) {
      loadCustomers();
      loadEligibleOrders();
    } else {
      loadEligibleOrders();
    }
  };

  const handleCustomerChange = (customerId) => {
    setForm(prev => ({ ...prev, customerId, orderId: '' }));
    loadEligibleOrders(customerId || null);
  };

  const handleOrderChange = (orderId) => {
    if (!orderId) {
      setForm(prev => ({ ...prev, orderId: '' }));
      return;
    }
    const selectedOrder = eligibleOrders.find(o => String(o.orderId) === String(orderId));
    setForm(prev => ({
      ...prev,
      orderId,
      customerId: selectedOrder?.customerId ? String(selectedOrder.customerId) : prev.customerId
    }));
  };

  const openEditModal = (item) => {
    setSelected(item);
    setEditForm({
      rating: item.rating || 5,
      comment: item.feedbackText || item.comment || ''
    });
    setEditHoverRating(0);
    setError('');
    setModal('edit');
  };

  const openDeleteModal = (item) => {
    setSelected(item);
    setError('');
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
  };

  // Submit Feedback Handler
  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    if (!form.orderId) {
      setError('Please select a completed order to link to this review.');
      return;
    }
    if (!form.comment.trim()) {
      setError('Please write a comment sharing your laundry experience.');
      return;
    }
    if (form.rating < 1 || form.rating > 5) {
      setError('Rating must be between 1 and 5.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        orderId: Number(form.orderId),
        rating: Number(form.rating),
        feedbackText: form.comment.trim(),
        comment: form.comment.trim()
      };
      if (canManageAll && form.customerId) {
        payload.customerId = Number(form.customerId);
      }

      await feedbackService.submitFeedback(payload);
      toast.success('Thank you! Your feedback has been published.');
      closeModal();
      loadFeedback();
      loadStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit feedback';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Edit Feedback Handler
  const handleEditFeedback = async (e) => {
    e.preventDefault();
    if (!editForm.comment.trim()) {
      setError('Comment cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await feedbackService.updateFeedback(selected.id, {
        rating: Number(editForm.rating),
        feedbackText: editForm.comment.trim(),
        comment: editForm.comment.trim()
      });
      toast.success('Feedback updated successfully.');
      closeModal();
      loadFeedback();
      loadStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update feedback';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete Feedback Handler
  const handleDeleteFeedback = async () => {
    setSaving(true);
    setError('');
    try {
      await feedbackService.deleteFeedback(selected.id);
      toast.success('Feedback deleted.');
      closeModal();
      loadFeedback();
      loadStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete feedback';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Calculate local average rating for filtered items
  const localAvgRating = useMemo(() => {
    if (!feedbackList.length) return '0.0';
    const sum = feedbackList.reduce((acc, f) => acc + (f.rating || 0), 0);
    return (sum / feedbackList.length).toFixed(1);
  }, [feedbackList]);

  return (
    <div style={{ padding: '0 0.5rem 3rem 0.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            margin: 0,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <FiStar style={{ color: '#FACC15' }} /> 
            {isCustomer ? 'My Ratings & Feedback' : 'Customer Experience & Feedback'}
          </h1>
          <p style={{ color: '#94A3B8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {isCustomer 
              ? 'Rate and review your completed laundry orders to help us continually elevate service quality.'
              : 'Monitor service ratings, verify customer experiences, and manage feedback on delivered orders.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => { loadFeedback(); loadStats(); }} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiRefreshCw /> Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={openCreateModal} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <FiPlus /> Submit Feedback
          </button>
        </div>
      </div>

      {/* Review Metrics Card & Rating Breakdown */}
      <div className="card-glass" style={{
        padding: '1.75rem',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        alignItems: 'center',
        border: '1px solid rgba(255, 107, 0, 0.2)'
      }}>
        {/* Left: Overall Rating Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            fontSize: '3.75rem',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1,
            letterSpacing: '-1px'
          }}>
            {stats?.averageRating ? stats.averageRating.toFixed(1) : localAvgRating}
          </div>
          <div>
            <div style={{ marginBottom: '6px' }}>
              <DisplayStars rating={Math.round(Number(stats?.averageRating || localAvgRating))} size="1.4rem" />
            </div>
            <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.95rem' }}>
              Average Customer Rating
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '2px' }}>
              Based on {stats?.totalReviews ?? feedbackList.length} verified order review{(stats?.totalReviews ?? feedbackList.length) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Middle: Star Distribution Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats?.ratingCounts?.[star] || feedbackList.filter(f => f.rating === star).length;
            const total = stats?.totalReviews || feedbackList.length || 1;
            const pct = Math.round((count / total) * 100);

            return (
              <div 
                key={star} 
                onClick={() => setRatingFilter(ratingFilter === String(star) ? 'ALL' : String(star))}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  backgroundColor: ratingFilter === String(star) ? 'rgba(255, 107, 0, 0.15)' : 'transparent'
                }}
                title={`Filter by ${star} Stars`}
              >
                <span style={{ fontSize: '0.8rem', color: '#CBD5E1', width: '38px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {star} <span style={{ color: '#FACC15' }}>★</span>
                </span>
                <div style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: '#1E293B',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: star >= 4 ? '#22C55E' : star === 3 ? '#FACC15' : '#EF4444',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', width: '32px', textAlign: 'right' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Satisfaction & Reward Highlights */}
        <div style={{
          backgroundColor: 'rgba(255, 107, 0, 0.08)',
          border: '1px solid rgba(255, 107, 0, 0.25)',
          padding: '1.25rem',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🌟</span>
            <div>
              <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>
                {stats?.satisfactionRate ?? 100}% Satisfaction Rate
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                Customer ratings of 4 or 5 stars on delivered orders
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid rgba(255, 107, 0, 0.15)', paddingTop: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🎁</span>
            <div>
              <div style={{ fontWeight: 700, color: '#FF6B00', fontSize: '0.9rem' }}>
                +25 Loyalty Points per Feedback
              </div>
              <div style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>
                Automatically credited to customer wallet upon verification
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search & Filter Bar */}
      <div className="card-glass" style={{
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Left: Tab selection */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'all' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'all' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiMessageSquare size={15} /> All Reviews
          </button>
          {isCustomer && (
            <button
              onClick={() => setActiveTab('my')}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'my' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'my' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiUser size={15} /> My Feedback
            </button>
          )}
        </div>

        {/* Right: Search, Rating Filter & Date Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search customer, comment, order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.85rem', height: '38px', backgroundColor: '#0F172A' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Rating Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiFilter style={{ color: '#94A3B8' }} />
            <select
              className="form-input"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{ fontSize: '0.85rem', height: '38px', backgroundColor: '#0F172A', minWidth: '130px' }}
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars (★ 5)</option>
              <option value="4">4 Stars (★ 4)</option>
              <option value="3">3 Stars (★ 3)</option>
              <option value="2">2 Stars (★ 2)</option>
              <option value="1">1 Star (★ 1)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiCalendar style={{ color: '#94A3B8' }} />
            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ fontSize: '0.85rem', height: '38px', backgroundColor: '#0F172A' }}
              title="Filter by submission date"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.75rem', height: '38px' }}
                title="Clear date filter"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#A0A0B0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading feedback records...</p>
        </div>
      ) : feedbackList.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 1.5rem', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
            No Feedback Found
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#94A3B8', fontSize: '0.9rem', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            {search || ratingFilter !== 'ALL' || dateFilter 
              ? 'No reviews match your current search and filter criteria. Try adjusting or clearing your filters.'
              : 'Be the first to leave a verified review on your delivered laundry order!'}
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ fontWeight: 600 }}>
            Submit Your Feedback
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.4rem'
        }}>
          {feedbackList.map((item) => {
            const isOwner = isCustomer && user?.fullName === item.customerName;
            const canEdit = isOwner || canManageAll;
            const canDelete = isOwner || canManageAll;

            return (
              <div
                key={item.id}
                className="card-glass"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
              >
                <div>
                  {/* Card Header: Customer Info & Rating */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 107, 0, 0.18)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        border: '1px solid rgba(255, 107, 0, 0.3)'
                      }}>
                        {(item.customerName || 'Customer')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem' }}>
                          {item.customerName || 'Valued Customer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {item.customerEmail ? `${item.customerEmail} • ` : ''}
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <DisplayStars rating={item.rating} />
                      <div style={{ fontSize: '0.75rem', color: '#FACC15', fontWeight: 700, marginTop: '2px' }}>
                        {RATING_LABELS[item.rating] || `${item.rating} Stars`}
                      </div>
                    </div>
                  </div>

                  {/* Verified Order Tag */}
                  {item.orderId && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      color: '#38BDF8',
                      marginBottom: '1rem',
                      fontWeight: 600
                    }}>
                      <FiShoppingBag size={13} />
                      <span>Verified Order #{item.orderId}</span>
                      <span style={{ color: '#94A3B8' }}>•</span>
                      <span style={{ color: '#22C55E' }}>DELIVERED</span>
                    </div>
                  )}

                  {/* Comment Body */}
                  <p style={{
                    color: '#E2E8F0',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    margin: '0 0 1.25rem 0',
                    fontStyle: 'italic',
                    whiteSpace: 'pre-wrap'
                  }}>
                    "{item.feedbackText || item.comment || 'Great laundry service!'}"
                  </p>
                </div>

                {/* Card Footer: Status & Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.9rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiCheckCircle size={11} /> PUBLISHED
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {canEdit && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => openEditModal(item)}
                        style={{
                          padding: '5px 11px',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <FiEdit2 size={12} /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="btn btn-outline"
                        onClick={() => openDeleteModal(item)}
                        style={{
                          padding: '5px 9px',
                          fontSize: '0.78rem',
                          color: '#EF4444',
                          borderColor: 'rgba(239, 68, 68, 0.3)'
                        }}
                        title="Delete Feedback"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE FEEDBACK MODAL */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(255, 107, 0, 0.3)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiStar /> Submit Order Feedback
              </h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: '1rem 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateFeedback}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.25rem 0' }}>
                {/* Manager / Admin Customer Selector */}
                {canManageAll && (
                  <F label="Select Customer" required>
                    <select
                      className="form-input"
                      value={form.customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                    >
                      <option value="">-- All / Auto from Order --</option>
                      {customerOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.email || c.phoneNumber})
                        </option>
                      ))}
                    </select>
                  </F>
                )}

                {/* Link to Completed Order Selector */}
                <F label="Link to Completed / Delivered Order" required>
                  {loadingOrders ? (
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Loading delivered orders...</div>
                  ) : eligibleOrders.length === 0 ? (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: '#FCA5A5',
                      fontSize: '0.85rem'
                    }}>
                      ⚠️ No completed/delivered orders eligible for feedback found. Feedback can only be submitted for completed orders in <strong>DELIVERED</strong> status.
                    </div>
                  ) : (
                    <select
                      className="form-input"
                      required
                      value={form.orderId}
                      onChange={(e) => handleOrderChange(e.target.value)}
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: 'rgba(255, 107, 0, 0.4)' }}
                    >
                      <option value="">-- Select Completed Order --</option>
                      {eligibleOrders.map((o) => (
                        <option key={o.orderId} value={o.orderId}>
                          Order #{o.orderId} — {o.customerName} (Rs. {Number(o.totalPrice || 0).toFixed(2)})
                          {o.deliveryDate ? ` • Delivered ${o.deliveryDate}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <small style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                    Rule: Only orders in completed / DELIVERED status are eligible for customer feedback.
                  </small>
                </F>

                {/* Rating 1 to 5 Selector */}
                <F label="Rating (1 to 5 Stars)" required>
                  <div style={{ padding: '8px 12px', backgroundColor: '#1E293B', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <InteractiveStars
                      rating={form.rating}
                      hoverRating={hoverRating}
                      onSelect={(val) => setForm({ ...form, rating: val })}
                      setHoverRating={setHoverRating}
                      size={32}
                    />
                  </div>
                </F>

                {/* Comment Textarea */}
                <F label="Customer Comment / Review" required>
                  <textarea
                    className="form-input"
                    rows={4}
                    required
                    placeholder="Tell us about the fabric cleanliness, scent, packaging, and on-time delivery..."
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving || (eligibleOrders.length === 0 && !form.orderId)}
                  style={{ fontWeight: 600 }}
                >
                  {saving ? 'Publishing...' : 'Publish Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FEEDBACK MODAL */}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(255, 107, 0, 0.3)' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#FF6B00' }}>✏️ Edit Review #{selected?.id}</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: '1rem 0 0 0' }}>{error}</div>
            )}

            {/* Customer & Order Context Badge */}
            {selected && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px 14px',
                borderRadius: '8px',
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: '#94A3B8' }}>Customer: </span>
                  <strong style={{ color: '#FFFFFF' }}>{selected.customerName || 'Valued Customer'}</strong>
                  {selected.customerEmail && <span style={{ color: '#64748B' }}> ({selected.customerEmail})</span>}
                </div>
                {selected.orderId && (
                  <div style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '0.78rem'
                  }}>
                    Order #{selected.orderId}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleEditFeedback}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.25rem 0' }}>
                <F label="Rating (1 to 5 Stars)" required>
                  <div style={{ padding: '8px 12px', backgroundColor: '#1E293B', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <InteractiveStars
                      rating={editForm.rating}
                      hoverRating={editHoverRating}
                      onSelect={(val) => setEditForm({ ...editForm, rating: val })}
                      setHoverRating={setEditHoverRating}
                      size={32}
                    />
                  </div>
                </F>

                <F label="Review Comment" required>
                  <textarea
                    className="form-input"
                    rows={4}
                    required
                    value={editForm.comment}
                    onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                    style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}
                  />
                </F>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            style={{ maxWidth: 440, backgroundColor: '#0B1120', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ color: '#EF4444' }}>🗑️ Delete Feedback</h3>
              <button className="btn btn-icon" onClick={closeModal}><FiX size={18} /></button>
            </div>
            <p style={{ color: '#CBD5E1', padding: '1.25rem 0', margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this review for Order #{selected?.orderId}? This action cannot be reversed.
            </p>
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn btn-danger" disabled={saving} onClick={handleDeleteFeedback}>
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
