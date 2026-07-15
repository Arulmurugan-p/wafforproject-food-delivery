import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminPanel from './AdminPanel';

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

function FoodImage({ itemName, backendUrl, style }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const src = backendUrl || foodImages[itemName] || defaultImage;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: style?.height || '180px',
      overflow: 'hidden',
      borderRadius: style?.borderRadius || '12px 12px 0 0',
      backgroundColor: '#E9E9EB',
      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.03)',
      ...style
    }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, #f3f3f3 25%, #e6e6e6 50%, #f3f3f3 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-effect 1.5s infinite linear'
        }} />
      )}
      <img
        src={error ? defaultImage : src}
        alt={itemName}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          opacity: loading ? 0 : 1
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      />
      <style>{`
        @keyframes shimmer-effect {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

function Dashboard({ token, role, user, cart, addToCart, updateQuantity, removeFromCart, clearCart }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [customerName, setCustomerName] = useState(user || 'Arul Murugan');
  const [address, setAddress] = useState('Anna Nagar, Chennai');
  const [phone, setPhone] = useState('+1 555-0123');
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  
  // Delivery Partner State
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [deliveryActionId, setDeliveryActionId] = useState(null);

  const navigate = useNavigate();

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // 1. Fetch courier partner tasks periodically
  const fetchDeliveries = React.useCallback(async () => {
    if (role !== 'ROLE_DELIVERY_PARTNER') return;
    try {
      const res = await axios.get('http://localhost:8081/api/delivery/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDeliveryLoading(false);
    }
  }, [token, role]);

  useEffect(() => {
    if (role === 'ROLE_DELIVERY_PARTNER') {
      fetchDeliveries();
      const interval = setInterval(fetchDeliveries, 2000);
      return () => clearInterval(interval);
    }
  }, [role, fetchDeliveries]);

  const handleDeliveryAction = async (orderId, actionPath) => {
    setDeliveryActionId(orderId);
    try {
      await axios.post(`http://localhost:8081/api/delivery/tasks/${orderId}/${actionPath}`, {}, config);
      fetchDeliveries();
    } catch (err) {
      console.error(err);
      alert('Failed to execute courier action.');
    } finally {
      setDeliveryActionId(null);
    }
  };

  // ---------------------------------------------------
  // RENDER: ADMIN DASHBOARD
  // ---------------------------------------------------
  if (role === 'ROLE_ADMIN') {
    return <AdminPanel token={token} onLogout={() => {}} />;
  }

  // ---------------------------------------------------
  // RENDER: DELIVERY PARTNER DASHBOARD
  // ---------------------------------------------------
  if (role === 'ROLE_DELIVERY_PARTNER') {
    return (
      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C1C1C', marginBottom: '8px' }}>🛵 Courier Delivery Board</h1>
        <p style={{ fontSize: '0.85rem', color: '#686B78', marginBottom: '24px' }}>Accept assignments and complete orders</p>

        {deliveryLoading && deliveries.length === 0 ? (
          <p style={{ color: '#686B78' }}>Loading assignments...</p>
        ) : deliveries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed #E9E9EB', borderRadius: '12px' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>📭</span>
            <p style={{ fontSize: '0.9rem', color: '#686B78' }}>No delivery jobs currently assigned to you.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {deliveries.map(d => (
              <div key={d.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1C1C1C' }}>Delivery for Order #{d.orderId}</h3>
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#686B78', lineHeight: '1.5' }}>
                    <div>👤 Client Name: <strong>{d.customerName}</strong></div>
                    <div>📍 Deliver to: <strong>{d.address}</strong></div>
                    <div>📞 Contact Phone: <strong>{d.phone}</strong></div>
                    <div>🍔 Food: <strong>{d.foodItem}</strong> (₹{d.amount.toLocaleString('en-IN')})</div>
                    <div>📦 Delivery Status: <span className="badge badge-delivery">{d.status}</span></div>
                    {d.eta && <div>🕒 Estimated ETA: <strong>{d.eta} mins</strong></div>}
                  </div>
                </div>

                <div>
                  {d.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleDeliveryAction(d.orderId, 'accept')}
                      disabled={deliveryActionId !== null}
                      className="btn-primary"
                      style={{ background: '#FC8019', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      Accept Delivery
                    </button>
                  )}

                  {d.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleDeliveryAction(d.orderId, 'start')}
                      disabled={deliveryActionId !== null}
                      className="btn-primary"
                      style={{ background: '#1A73E8', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      Start Delivery
                    </button>
                  )}

                  {d.status === 'STARTED' && (
                    <button
                      onClick={() => handleDeliveryAction(d.orderId, 'reached')}
                      disabled={deliveryActionId !== null}
                      className="btn-primary"
                      style={{ background: '#FFC107', color: '#1C1C1C', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      Reached Location
                    </button>
                  )}

                  {d.status === 'REACHED' && (
                    <button
                      onClick={() => handleDeliveryAction(d.orderId, 'deliver')}
                      disabled={deliveryActionId !== null}
                      className="btn-primary"
                      style={{ background: '#28A745', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      Mark Delivered
                    </button>
                  )}

                  {d.status === 'DELIVERED' && (
                    <span style={{ color: '#28A745', fontWeight: 700, fontSize: '0.85rem' }}>✓ Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------
  // RENDER: CUSTOMER DASHBOARD (DEFAULT)
  // ---------------------------------------------------
  const CATEGORIES = [
    { name: 'All', icon: '🍽️' },
    { name: 'Burgers', icon: '🍔' },
    { name: 'Pizzas', icon: '🍕' },
    { name: 'Pasta', icon: '🍝' },
    { name: 'Biryani', icon: '🍲' },
    { name: 'Wraps', icon: '🌯' },
    { name: 'Drinks', icon: '🥤' },
    { name: 'Desserts', icon: '🍰' },
    { name: 'Chinese', icon: '🥢' }
  ];

  const POPULAR_RESTAURANTS = [
    { name: 'Burger Club', rating: '4.5', time: '30-40 min', cost: '₹150 for one', icon: '🍔' },
    { name: 'Pizza House', rating: '4.3', time: '25-35 min', cost: '₹120 for one', icon: '🍕' },
    { name: 'Biryani Palace', rating: '4.6', time: '35-45 min', cost: '₹200 for one', icon: '🍲' },
    { name: 'Pasta Point', rating: '4.2', time: '20-30 min', cost: '₹180 for one', icon: '🍝' },
    { name: 'Chinese Wok', rating: '4.4', time: '30-40 min', cost: '₹150 for one', icon: '🥢' }
  ];

  const RECOMMENDED_ITEMS = [
    { name: 'Classic Cheese Burger', price: 199, icon: '🍔', category: 'Burgers' },
    { name: 'Farmhouse Pizza', price: 349, icon: '🍕', category: 'Pizzas' },
    { name: 'Pasta Alfredo', price: 249, icon: '🍝', category: 'Pasta' },
    { name: 'Veg Biryani', price: 229, icon: '🍲', category: 'Biryani' },
    { name: 'Paneer Tikka Wrap', price: 179, icon: '🌯', category: 'Wraps' },
    { name: 'Coke', price: 60, icon: '🥤', category: 'Drinks' },
    { name: 'Choco Lava Cake', price: 149, icon: '🍰', category: 'Desserts' },
    { name: 'Garlic Bread', price: 129, icon: '🥖', category: 'Chinese' }
  ];

  const filteredItems = activeCategory === 'All' 
    ? RECOMMENDED_ITEMS 
    : RECOMMENDED_ITEMS.filter(item => item.category === activeCategory);

  const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = itemTotal > 0 ? 40 : 0;
  const handlingFee = itemTotal > 0 ? 10 : 0;
  const totalAmount = itemTotal + deliveryFee + handlingFee;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setCheckoutError(null);
    setCheckingOut(true);

    try {
      const description = cart.map(i => `${i.name}${i.quantity > 1 ? ' x' + i.quantity : ''}`).join(', ');

      const response = await axios.post('http://localhost:8081/api/orders', {
        customerName,
        foodItem: description,
        amount: parseFloat(totalAmount.toFixed(2)),
        address,
        phone
      }, config);

      // Clear local cart via sync
      clearCart();
      setShowCheckoutModal(false);

      // Redirect to Order Tracking timeline
      navigate(`/track/${response.data.id}`);
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.message || 'Failed to submit order request. Ensure backend services are online.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {/* Food Browser */}
      <div className="center-food-browser">
        <div style={{
          background: 'linear-gradient(135deg, #FC8019, #FF5A5F)',
          borderRadius: '20px',
          padding: '32px 40px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          boxShadow: '0 8px 24px rgba(252, 128, 25, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ zIndex: 2 }}>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '6px' }}>Good food, great mood.</h1>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '20px', fontWeight: 500 }}>
              Order from the best restaurants near you and get it delivered in no time.
            </p>
            <button 
              onClick={() => document.getElementById('recommended-sec').scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: '#FFFFFF',
                color: '#FC8019',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              Order Now
            </button>
          </div>
          
          <div style={{ fontSize: '6rem', zIndex: 1, transform: 'rotate(12deg)' }}>🍔🥤</div>
        </div>

        {/* Categories Scroller */}
        <div className="categories-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`category-pill ${activeCategory === cat.name ? 'active' : ''}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
          <button className="category-pill">More ∨</button>
        </div>

        {/* Popular Restaurants */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1C1C1C' }}>Popular Restaurants</h2>
            <span style={{ fontSize: '0.8rem', color: '#FC8019', fontWeight: 600, cursor: 'pointer' }}>View All</span>
          </div>

          <div className="restaurants-grid">
            {POPULAR_RESTAURANTS.map((rest, idx) => (
              <div key={idx} className="restaurant-card">
                <FoodImage 
                  itemName={rest.name === 'Burger Club' ? 'Classic Cheese Burger' : 
                            rest.name === 'Pizza House' ? 'Farmhouse Pizza' : 
                            rest.name === 'Biryani Palace' ? 'Veg Biryani' : 
                            rest.name === 'Pasta Point' ? 'Pasta Alfredo' : 
                            rest.name === 'Chinese Wok' ? 'Chinese Noodles' : 'Default'} 
                  style={{ height: '80px', margin: '-12px -12px 10px -12px', borderRadius: '11px 11px 0 0' }} 
                />
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C1C1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rest.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#28A745', fontWeight: 700 }}>★ {rest.rating}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#686B78', marginTop: '6px' }}>
                  <span>{rest.time}</span>
                  <span>{rest.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended for you */}
        <div id="recommended-sec">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1C1C1C' }}>Recommended for you</h2>
            <span style={{ fontSize: '0.8rem', color: '#FC8019', fontWeight: 600, cursor: 'pointer' }}>View All</span>
          </div>

          <div className="recommended-grid">
            {filteredItems.map((item, idx) => {
              const cartItem = cart.find(i => i.name === item.name);
              return (
                <div key={idx} className="food-card">
                  <FoodImage 
                    itemName={item.name} 
                    backendUrl={item.imageUrl} 
                    style={{ margin: '-14px -14px 0 -14px', borderRadius: '15px 15px 0 0', height: '180px' }} 
                  />
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1C1C1C' }}>{item.name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1C1C1C' }}>₹{item.price.toLocaleString('en-IN')}</span>
                      
                      {cartItem ? (
                        <div className="qty-controls">
                          <button onClick={() => updateQuantity(item.name, -1)} className="qty-btn">-</button>
                          <span className="qty-count">{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(item.name, 1)} className="qty-btn">+</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(item)}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #FC8019',
                            color: '#FC8019',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: '8px'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = '#FC8019';
                            e.target.style.color = '#fff';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = '#FFFFFF';
                            e.target.style.color = '#FC8019';
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart & Checkout Summary */}
      <div className="right-cart-sidebar">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1C1C', marginBottom: '4px' }}>Your Order</h2>
        <span style={{ fontSize: '0.8rem', color: '#686B78', display: 'block', marginBottom: '24px' }}>
          {totalItemsCount} items selected
        </span>

        {/* Cart Item rows */}
        {cart.length === 0 ? (
          <div className="cart-items-list" style={{ justifyContent: 'center', alignItems: 'center', color: '#A3A3A3' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🛒</span>
            <p style={{ fontSize: '0.85rem' }}>Cart is empty</p>
          </div>
        ) : (
          <div className="cart-items-list">
            {cart.map((item) => (
              <div key={item.name} className="cart-item-row">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FoodImage 
                      itemName={item.name} 
                      backendUrl={item.imageUrl} 
                      style={{ width: '24px', height: '24px', borderRadius: '4px', margin: 0 }} 
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1C' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#686B78', display: 'block', marginTop: '2px' }}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="qty-controls">
                    <button onClick={() => updateQuantity(item.name, -1)} className="qty-btn">-</button>
                    <span className="qty-count">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.name, 1)} className="qty-btn">+</button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.name)} 
                    style={{ background: 'transparent', fontSize: '1.1rem', color: '#A3A3A3' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="coupon-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🏷️</span>
              <span>Apply Coupon</span>
            </div>
            <span>&gt;</span>
          </div>
        )}

        {/* Pricing break downs */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid #E9E9EB', paddingTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#686B78', marginBottom: '10px' }}>
              <span>Item Total</span>
              <span>₹{itemTotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#686B78', marginBottom: '10px' }}>
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#686B78', marginBottom: '12px' }}>
              <span>Handling Fee</span>
              <span>₹{handlingFee.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#1C1C1C', borderTop: '1px solid #E9E9EB', paddingTop: '12px' }}>
              <span>Total Amount</span>
              <span style={{ color: '#FC8019' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <div style={{
              background: '#E8F5E9',
              border: '1px solid #C8E6C9',
              borderRadius: '8px',
              padding: '10px',
              color: '#2E7D32',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px'
            }}>
              <span>🎁</span>
              <span>You will save ₹50 on this order</span>
            </div>
          </div>
        )}

        {/* Proceed to Checkout */}
        <button 
          onClick={handleProceedCheckout}
          disabled={cart.length === 0}
          className="btn-primary"
          style={{ opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
        >
          Proceed to Checkout
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #E9E9EB', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛵</span>
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1C1C1C' }}>Fast Delivery</h4>
              <p style={{ fontSize: '0.7rem', color: '#686B78' }}>On-time, every time</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛡️</span>
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1C1C1C' }}>Best Quality</h4>
              <p style={{ fontSize: '0.7rem', color: '#686B78' }}>Fresh & hygienic food</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '440px', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: '#1C1C1C' }}>Confirm Your Order</h3>
            <p style={{ fontSize: '0.85rem', color: '#686B78', marginBottom: '20px' }}>
              Your order status will be set to **REQUESTED** pending Admin approval.
            </p>

            {checkoutError && (
              <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px' }}>
                ⚠️ {checkoutError}
              </div>
            )}

            <form onSubmit={handleConfirmOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter contact phone"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCheckoutModal(false)}
                  style={{
                    flex: 1,
                    background: '#F7F8FA',
                    border: '1px solid #E9E9EB',
                    color: '#686B78',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={checkingOut}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', opacity: checkingOut ? 0.7 : 1 }}
                >
                  {checkingOut ? 'Submitting Request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
