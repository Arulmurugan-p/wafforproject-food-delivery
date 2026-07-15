import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

function OrderTracking({ token }) {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = React.useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`http://localhost:8081/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Order not found or authorization error.');
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 2000);
    return () => clearInterval(interval);
  }, [fetchDetails]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'REQUESTED': return 'badge-placed';
      case 'ORDER_APPROVED': return 'badge-placed';
      case 'ORDER_REJECTED': return 'badge-cancelled';
      case 'PAYMENT_PENDING': return 'badge-payment';
      case 'PAYMENT_VERIFIED': return 'badge-ready';
      case 'PAYMENT_REJECTED': return 'badge-cancelled';
      case 'PREPARING': return 'badge-preparing';
      case 'FOOD_READY': return 'badge-ready';
      case 'DELIVERY_ASSIGNED': return 'badge-delivery';
      case 'OUT_FOR_DELIVERY': return 'badge-delivery';
      case 'DELIVERED': return 'badge-delivered';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  };

  const getDotClass = (logStatus) => {
    if (logStatus === 'COMPLETED') return 'completed';
    if (logStatus === 'FAILED') return 'failed';
    return 'active';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/orders" style={{ color: '#FC8019', fontWeight: 600, fontSize: '0.85rem' }}>
          ← Back to My Orders
        </Link>
      </div>

      {loading && !data ? (
        <p style={{ textAlign: 'center', color: '#686B78', padding: '60px' }}>Loading order tracking...</p>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#DC3545', marginBottom: '16px' }}>{error}</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      ) : data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Left Side: Camunda Workflow Timeline Logs */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1C1C1C', marginBottom: '8px' }}>
              Order Lifecycle Timeline
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#686B78', marginBottom: '24px' }}>
              Real-time audit log tracked via Camunda Process Orchestrator.
            </p>

            {data.logs.length === 0 ? (
              <p style={{ color: '#A3A3A3', fontStyle: 'italic' }}>Waiting for Camunda workflow to initialize...</p>
            ) : (
              <div className="tracking-timeline">
                {data.logs.map((log) => (
                  <div key={log.id} className={`tracking-item ${getDotClass(log.status)}`}>
                    <div className="tracking-dot" />
                    <div className="tracking-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1C1C1C' }}>{log.activityName}</h4>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: log.status === 'COMPLETED' ? 'rgba(40, 167, 69, 0.12)' :
                                      log.status === 'FAILED' ? 'rgba(220, 53, 69, 0.12)' : 'rgba(252, 128, 25, 0.12)',
                          color: log.status === 'COMPLETED' ? '#28A745' :
                                 log.status === 'FAILED' ? '#DC3545' : '#FC8019'
                        }}>
                          {log.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#686B78', marginTop: '6px', lineHeight: '1.4' }}>
                        {log.details}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#A3A3A3', marginTop: '6px' }}>
                        🕒 {formatTime(log.createdAt)} &bull; Service Type: <strong>{log.activityType}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Order Summary Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>Order Details</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#686B78', fontSize: '0.85rem' }}>Order ID:</span>
                <span style={{ fontWeight: 700 }}>#{data.order.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#686B78', fontSize: '0.85rem' }}>Customer Name:</span>
                <span style={{ fontWeight: 700 }}>{data.order.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#686B78', fontSize: '0.85rem' }}>Item:</span>
                <span style={{ fontWeight: 700, color: '#FC8019' }}>{data.order.foodItem}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#686B78', fontSize: '0.85rem' }}>Total Amount:</span>
                <span style={{ fontWeight: 800 }}>₹{data.order.amount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E9E9EB', paddingTop: '12px', marginTop: '12px' }}>
                <span style={{ color: '#686B78', fontSize: '0.85rem' }}>Workflow Status:</span>
                <span className={`badge ${getStatusClass(data.order.status)}`}>{data.order.status}</span>
              </div>
            </div>

            {/* Custom delivery alerts banner */}
            {data.order.status === 'DELIVERED' && (
              <div className="card" style={{
                background: 'linear-gradient(135deg, #E8F5E9, #F1F8E9)',
                border: '1px solid #C8E6C9',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{ fontSize: '2rem' }}>🎉</span>
                <div>
                  <h4 style={{ color: '#2E7D32', fontSize: '0.95rem', fontWeight: 700 }}>Order Handover Complete</h4>
                  <p style={{ fontSize: '0.8rem', color: '#558B2F', marginTop: '2px' }}>Your delicious food has been safely delivered.</p>
                </div>
              </div>
            )}

            {data.order.status === 'CANCELLED' && (
              <div className="card" style={{
                background: 'linear-gradient(135deg, #FCE8E6, #FFF5F5)',
                border: '1px solid #FAD2CF',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{ fontSize: '2rem' }}>❌</span>
                <div>
                  <h4 style={{ color: '#C5221F', fontSize: '0.95rem', fontWeight: 700 }}>Order Cancelled</h4>
                  <p style={{ fontSize: '0.8rem', color: '#EA4335', marginTop: '2px' }}>This order has been cancelled or rejected.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTracking;
