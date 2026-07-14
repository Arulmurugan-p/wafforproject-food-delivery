import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OrderDetailsModal({ orderId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8081/api/orders/${orderId}`);
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [orderId]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'PLACED': return 'badge-placed';
      case 'PAYMENT_PROCESSING': return 'badge-payment';
      case 'KITCHEN_PREPARING': return 'badge-preparing';
      case 'FOOD_READY': return 'badge-ready';
      case 'OUT_FOR_DELIVERY': return 'badge-delivery';
      case 'DELIVERED': return 'badge-delivered';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  };

  const getDotClass = (status) => {
    if (status === 'COMPLETED') return 'completed';
    if (status === 'FAILED') return 'failed';
    return 'active';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        background: '#161c2d',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: '#9ca3af',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          &times;
        </button>

        {loading && <p style={{ textAlign: 'center', padding: '40px' }}>Loading order timeline...</p>}
        
        {error && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#f87171', marginBottom: '16px' }}>{error}</p>
            <button onClick={onClose} className="badge" style={{ background: '#ff6b35', color: '#fff', cursor: 'pointer' }}>Close</button>
          </div>
        )}

        {data && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
              Order #{data.order.id}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span className={`badge ${getStatusClass(data.order.status)}`}>
                {data.order.status}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                Customer: <strong>{data.order.customerName}</strong>
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Food Item</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff6b35' }}>{data.order.foodItem}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Total Amount</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{data.order.amount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: '#f3f4f6' }}>
              Camunda Workflow Execution Logs
            </h4>

            {data.logs.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic', padding: '12px 0' }}>
                No workflow events recorded yet.
              </p>
            ) : (
              <div className="timeline">
                {data.logs.map((log) => (
                  <div key={log.id} className={`timeline-item ${getDotClass(log.status)}`}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#f3f4f6' }}>{log.activityName}</strong>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: log.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 
                                      log.status === 'FAILED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: log.status === 'COMPLETED' ? '#34d399' : 
                                 log.status === 'FAILED' ? '#f87171' : '#60a5fa'
                        }}>
                          {log.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '6px', lineHeight: '1.4' }}>
                        {log.details}
                      </p>
                      <p className="timeline-time">
                        🕒 {formatTime(log.createdAt)} (Type: {log.activityType})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderDetailsModal;
