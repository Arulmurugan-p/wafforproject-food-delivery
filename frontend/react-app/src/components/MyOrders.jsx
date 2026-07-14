import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const foodImages = {
  "Classic Cheese Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
  "Farmhouse Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
  "Pasta Alfredo": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=500&q=80",
  "Veg Biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80",
  "Paneer Tikka Wrap": "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?auto=format&fit=crop&w=500&q=80",
  "Coke": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80",
  "Choco Lava Cake": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80",
  "Garlic Bread": "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=500&q=80",
  "French Fries": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80",
  "Chinese Noodles": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
};

const defaultImage = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=500&q=80";

function MyOrders({ token, role }) {
  const getFirstItemImage = (foodItem) => {
    if (!foodItem) return defaultImage;
    const parts = foodItem.split(',');
    if (parts.length === 0) return defaultImage;
    let firstName = parts[0].split(' x')[0].trim();
    return foodImages[firstName] || defaultImage;
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      let endpoint = 'http://localhost:8081/api/orders/customer'; // default customer
      if (role === 'ROLE_ADMIN') {
        endpoint = 'http://localhost:8081/api/orders';
      } else if (role === 'ROLE_DELIVERY_PARTNER') {
        // Fetch historical courier deliveries
        endpoint = 'http://localhost:8081/api/delivery/tasks';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (role === 'ROLE_DELIVERY_PARTNER') {
        // Map delivery records to simulated order response format
        const mapped = response.data.map(d => ({
          id: d.orderId,
          customerName: 'Customer',
          foodItem: 'Courier Cargo',
          amount: 15.00, // placeholder amount for courier record list representation
          status: d.status,
          createdAt: d.createdAt
        }));
        setOrders(mapped);
      } else {
        setOrders(response.data);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [token, role]);

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

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleString();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1C1C' }}>
            {role === 'ROLE_ADMIN' ? 'All Orders (Admin Console)' : 'My Orders'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#686B78', marginTop: '4px' }}>
            {role === 'ROLE_ADMIN' ? 'Complete database of all food processing cycles' : 'Manage and track your active and past food orders'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#686B78', padding: '60px' }}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🥡</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1C1C1C', marginBottom: '8px' }}>No orders found</h2>
          <p style={{ fontSize: '0.9rem', color: '#686B78', marginBottom: '20px' }}>No entries found under this login category.</p>
          {role === 'ROLE_CUSTOMER' && <Link to="/" className="btn-primary">Order Now</Link>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px'
            }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #E9E9EB'
                }}>
                  <img 
                    src={getFirstItemImage(o.foodItem)} 
                    alt={o.foodItem} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1C1C1C' }}>Order #{o.id}</h3>
                    <span className={`badge ${getStatusClass(o.status)}`}>{o.status}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#686B78' }}>
                    Customer: <strong>{o.customerName}</strong> &bull; Item: <strong style={{ color: '#FC8019' }}>{o.foodItem}</strong> &bull; Price: <strong>₹{o.amount.toLocaleString('en-IN')}</strong>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#A3A3A3', marginTop: '4px' }}>Date: {formatTime(o.createdAt)}</p>
                </div>
              </div>

              <div>
                <Link 
                  to={`/track/${o.id}`}
                  style={{
                    border: '1px solid #FC8019',
                    color: '#FC8019',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#FC8019';
                    e.target.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#FC8019';
                  }}
                >
                  Track Lifecycle
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
