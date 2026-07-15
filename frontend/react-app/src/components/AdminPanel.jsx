import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel({ token, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [partners, setPartners] = useState([]);
  const [selectedPartners, setSelectedPartners] = useState({}); // task.taskId -> partnerUsername
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // taskId being processed

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchData = React.useCallback(async () => {
    if (!token) return;
    try {
      const currentConfig = {
        headers: { Authorization: `Bearer ${token}` }
      };
      // 1. Fetch all orders (to calculate statistics)
      const ordersRes = await axios.get('http://localhost:8081/api/orders', currentConfig);
      setOrders(ordersRes.data);

      // 2. Fetch active workflow tasks
      const tasksRes = await axios.get('http://localhost:8081/api/admin/tasks', currentConfig);
      setTasks(tasksRes.data);

      // 3. Fetch delivery partners
      const partnersRes = await axios.get('http://localhost:8081/api/admin/tasks/delivery-partners', currentConfig);
      setPartners(partnersRes.data);

      setError(null);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      } else {
        setError('Failed to sync admin console details.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Statistics calculation
  const pendingOrders = orders.filter(o => o.status === 'REQUESTED').length;
  const approvedOrders = orders.filter(o => o.status === 'ORDER_APPROVED').length;
  const rejectedOrders = orders.filter(o => o.status === 'ORDER_REJECTED').length;
  const pendingPayments = orders.filter(o => o.status === 'PAYMENT_PENDING').length;
  const preparing = orders.filter(o => o.status === 'PREPARING').length;
  const readyForDelivery = orders.filter(o => o.status === 'FOOD_READY').length;
  const outForDelivery = orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;

  const handleAction = async (taskId, actionPath, payload = {}) => {
    setActionLoading(taskId);
    try {
      await axios.post(`http://localhost:8081/api/admin/tasks/${taskId}/${actionPath}`, payload, config);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Action execution failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'REQUESTED': return 'badge-placed';
      case 'ORDER_APPROVED': return 'badge-placed';
      case 'PAYMENT_PENDING': return 'badge-payment';
      case 'PAYMENT_VERIFIED': return 'badge-ready';
      case 'PREPARING': return 'badge-preparing';
      case 'FOOD_READY': return 'badge-ready';
      case 'DELIVERY_ASSIGNED': return 'badge-delivery';
      case 'OUT_FOR_DELIVERY': return 'badge-delivery';
      case 'DELIVERED': return 'badge-delivered';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  };

  return (
    <div>
      {/* 1. Header Admin Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1C1C' }}>⚙️ Admin Control Cockpit</h1>
          <p style={{ fontSize: '0.85rem', color: '#686B78', marginTop: '4px' }}>
            Manage Camunda BPM user approvals, verify payments, track prep, and dispatch orders.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* 2. Admin Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Pending Orders', count: pendingOrders, color: '#1A73E8', bg: '#E8F0FE' },
          { label: 'Approved Orders', count: approvedOrders, color: '#1A73E8', bg: '#E8F0FE' },
          { label: 'Rejected Orders', count: rejectedOrders, color: '#C5221F', bg: '#FCE8E6' },
          { label: 'Pending Payments', count: pendingPayments, color: '#856404', bg: '#FFF3CD' },
          { label: 'Preparing', count: preparing, color: '#8E24AA', bg: '#F3E5F5' },
          { label: 'Ready for Deliv', count: readyForDelivery, color: '#2E7D32', bg: '#E8F5E9' },
          { label: 'Out for Deliv', count: outForDelivery, color: '#00838F', bg: '#E0F7FA' },
          { label: 'Delivered', count: delivered, color: '#2E7D32', bg: '#E8F5E9' },
          { label: 'Cancelled', count: cancelled, color: '#C5221F', bg: '#FCE8E6' }
        ].map((stat, idx) => (
          <div key={idx} className="card" style={{
            padding: '14px 18px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#686B78', fontWeight: 700, textTransform: 'uppercase', display: 'block', height: '32px', overflow: 'hidden' }}>
              {stat.label}
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, marginTop: '6px' }}>{stat.count}</h3>
          </div>
        ))}
      </div>

      {/* 3. Camunda Active Workflow Approvals */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔄</span> Tasks Pending Verification
        </h2>

        {loading && tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#686B78', padding: '40px' }}>Loading active tasks...</p>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed #E9E9EB', borderRadius: '12px' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🎉</span>
            <p style={{ fontSize: '0.9rem', color: '#686B78' }}>No tasks currently need verification.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E9E9EB', color: '#686B78', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Task Description</th>
                  <th style={{ padding: '12px 16px' }}>Details</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Workflow Action Controls</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.taskId} style={{ borderBottom: '1px solid #F7F8FA', fontSize: '0.85rem' }}>
                    <td style={{ padding: '16px' }}>
                      <strong style={{ display: 'block', color: '#1C1C1C' }}>{task.taskName}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#A3A3A3' }}>Task ID: {task.taskId.substring(0, 8)}...</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'block' }}>Order: <strong>#{task.orderId}</strong></span>
                      <span style={{ display: 'block', color: '#686B78' }}>Client: {task.customerName}</span>
                      <span style={{ display: 'block', color: '#FC8019', fontWeight: 600 }}>{task.foodItem} (₹{task.amount.toLocaleString('en-IN')})</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge ${getStatusClass(task.status)}`}>{task.status}</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          
                          {/* 1. APPROVE ORDER */}
                          {task.taskDefinitionKey === 'AdminApproveTask' && (
                            <>
                              <button
                                onClick={() => handleAction(task.taskId, 'approve-order')}
                                disabled={actionLoading !== null}
                                className="btn-primary"
                                style={{ background: '#28A745', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem' }}
                              >
                                Approve Order
                              </button>
                              <button
                                onClick={() => handleAction(task.taskId, 'reject-order')}
                                disabled={actionLoading !== null}
                                className="btn-primary"
                                style={{ background: '#DC3545', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem' }}
                              >
                                Reject Order
                              </button>
                            </>
                          )}

                          {/* 2. VERIFY PAYMENT */}
                          {task.taskDefinitionKey === 'AdminVerifyPaymentTask' && (
                            <>
                              <button
                                onClick={() => handleAction(task.taskId, 'verify-payment', { approved: true })}
                                disabled={actionLoading !== null}
                                className="btn-primary"
                                style={{ background: '#28A745', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem' }}
                              >
                                Approve Payment
                              </button>
                              <button
                                onClick={() => handleAction(task.taskId, 'verify-payment', { approved: false })}
                                disabled={actionLoading !== null}
                                className="btn-primary"
                                style={{ background: '#DC3545', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem' }}
                              >
                                Reject Payment
                              </button>
                            </>
                          )}

                          {/* 3. KITCHEN PREPARATION */}
                          {task.taskDefinitionKey === 'AdminKitchenPrepTask' && (
                            <>
                              {task.status !== 'PREPARING' ? (
                                <button
                                  onClick={() => handleAction(task.taskId, 'start-preparing')}
                                  disabled={actionLoading !== null}
                                  className="btn-primary"
                                  style={{ background: '#FC8019', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem' }}
                                >
                                  Start Preparing
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(task.taskId, 'food-ready')}
                                  disabled={actionLoading !== null}
                                  className="btn-primary"
                                  style={{ background: '#28A745', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem' }}
                                >
                                  Food Ready
                                </button>
                              )}
                            </>
                          )}

                          {/* 4. ASSIGN DELIVERY PARTNER */}
                          {task.taskDefinitionKey === 'AdminAssignDeliveryTask' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select
                                onChange={(e) => setSelectedPartners(prev => ({ ...prev, [task.taskId]: e.target.value }))}
                                value={selectedPartners[task.taskId] || ''}
                                className="form-input"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px', width: '160px' }}
                              >
                                <option value="">Select Partner</option>
                                {partners.map(p => (
                                  <option key={p.username} value={p.username}>{p.fullName} ({p.status})</option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  const courier = selectedPartners[task.taskId];
                                  if (!courier) {
                                    alert('Please choose a courier driver partner.');
                                    return;
                                  }
                                  handleAction(task.taskId, 'assign-delivery', { partnerUsername: courier });
                                }}
                                disabled={actionLoading !== null}
                                className="btn-primary"
                                style={{ background: '#FC8019', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem' }}
                              >
                                Assign
                              </button>
                            </div>
                          )}

                        </div>

                        {/* Always visible manual Cancel Override button */}
                        <button
                          onClick={() => handleAction(task.taskId, 'cancel-order')}
                          disabled={actionLoading !== null}
                          className="btn-primary"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(220, 53, 69, 0.4)',
                            color: '#DC3545',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}
                        >
                          Cancel Order
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
