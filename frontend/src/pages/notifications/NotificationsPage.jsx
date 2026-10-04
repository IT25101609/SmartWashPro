import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { 
  FiBell, FiCheck, FiCheckCircle, FiClock, 
  FiRefreshCw, FiShoppingBag, FiCreditCard, FiTruck, FiInfo, FiAlertCircle 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  ORDER_UPDATE: { icon: <FiShoppingBag size={18} />, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', label: 'Order Update' },
  PAYMENT_UPDATE: { icon: <FiCreditCard size={18} />, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', label: 'Payment Receipt' },
  PICKUP_SCHEDULED: { icon: <FiTruck size={18} />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', label: 'Pickup Courier' },
  LOW_INVENTORY: { icon: <FiAlertCircle size={18} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Inventory Alert' },
  EQUIPMENT_ALERT: { icon: <FiAlertCircle size={18} />, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', label: 'Equipment Alert' },
  COMPLAINT_UPDATE: { icon: <FiInfo size={18} />, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', label: 'Support Update' },
  GENERAL: { icon: <FiBell size={18} />, color: '#FF6B00', bg: 'rgba(255, 107, 0, 0.15)', label: 'General Announcement' }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | UNREAD | ORDER_UPDATE | PAYMENT_UPDATE

  const loadNotifications = () => {
    setLoading(true);
    api.get('/notifications', { params: { size: 50 } })
      .then(r => setNotifications(r.data.content || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredList = useMemo(() => {
    if (filter === 'UNREAD') return notifications.filter(n => !n.isRead);
    if (filter === 'ORDER_UPDATE') return notifications.filter(n => n.notificationType === 'ORDER_UPDATE');
    if (filter === 'PAYMENT_UPDATE') return notifications.filter(n => n.notificationType === 'PAYMENT_UPDATE');
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '0 0.5rem 2.5rem 0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FiBell style={{ color: '#FF6B00' }} /> Notifications & Alerts
          </h1>
          <p style={{ color: '#A0A0B0', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Stay updated with live wash status, courier arrivals, and payment receipts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadNotifications} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiRefreshCw /> Refresh
          </button>
          {unreadCount > 0 && (
            <button className="btn btn-primary" onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiCheck /> Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-glass" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All (${notifications.length})` },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'ORDER_UPDATE', label: 'Orders' },
          { key: 'PAYMENT_UPDATE', label: 'Payments' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: filter === tab.key ? '1px solid #FF6B00' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: filter === tab.key ? 'rgba(255, 107, 0, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              color: filter === tab.key ? '#FF6B00' : '#A0A0B0',
              fontWeight: filter === tab.key ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#A0A0B0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading alerts...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredList.map(n => {
            const conf = TYPE_CONFIG[n.notificationType] || TYPE_CONFIG.GENERAL;

            return (
              <div 
                key={n.id} 
                className="card-glass" 
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  cursor: !n.isRead ? 'pointer' : 'default',
                  backgroundColor: n.isRead ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 41, 59, 0.85)',
                  borderLeft: !n.isRead ? '4px solid #FF6B00' : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease',
                  opacity: n.isRead ? 0.75 : 1
                }}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                {/* Type Icon */}
                <div style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: conf.bg,
                  color: conf.color,
                  flexShrink: 0
                }}>
                  {conf.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: !n.isRead ? 800 : 600, color: '#FFFFFF', fontSize: '0.95rem' }}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: '#FF6B00',
                          boxShadow: '0 0 8px #FF6B00',
                          display: 'inline-block' 
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 0 0', color: '#CBD5E1', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {n.message}
                  </p>

                  <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: conf.color, backgroundColor: conf.bg, padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {conf.label}
                    </span>
                    {!n.isRead && (
                      <span style={{ fontSize: '0.75rem', color: '#FF6B00', fontWeight: 600 }}>
                        Click to mark as read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!filteredList.length && (
            <div className="card-glass" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 700 }}>
                You're all caught up!
              </h3>
              <p style={{ margin: 0, color: '#888899', fontSize: '0.85rem' }}>
                No notifications to display in this category.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
