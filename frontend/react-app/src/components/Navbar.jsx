import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Navbar({ token, user, onLogout, cartCount }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:8081/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const markAllRead = async () => {
    if (!token) return;
    try {
      await axios.post('http://localhost:8081/api/notifications/mark-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      setShowNotifDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E9E9EB',
      padding: '12px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Left: Logo & Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🍔</span>
            <span style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#FC8019',
              letterSpacing: '-0.5px'
            }}>
              Mummy's Foods
            </span>
          </Link>

          {/* Location Picker */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F7F8FA',
            border: '1px solid #E9E9EB',
            padding: '6px 14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}>
            <span style={{ fontSize: '0.95rem' }}>📍</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6rem', color: '#686B78', fontWeight: 600, textTransform: 'uppercase' }}>Deliver to</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1C1C1C' }}>Anna Nagar, Chennai</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#686B78', marginLeft: '6px' }}>▼</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#F7F8FA',
          border: '1px solid #E9E9EB',
          borderRadius: '10px',
          padding: '2px 2px 2px 12px',
          width: '380px'
        }}>
          <span style={{ fontSize: '0.9rem', color: '#A3A3A3', marginRight: '8px' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search for restaurants, foods..."
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.85rem',
              color: '#1C1C1C',
              flex: 1,
              outline: 'none'
            }}
          />
          <button style={{
            background: '#FC8019',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: '8px'
          }}>
            Search
          </button>
        </div>

        {/* Right: Notifications, Cart, Login/Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Notifications Icon with Dropdown Trigger */}
          {token && (
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '1.25rem' }}>🔔</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#686B78' }}>Alerts</span>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#FF5A5F',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '15px',
                    height: '15px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: '-6px',
                    left: '12px'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Dropdown Box */}
              {showNotifDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '32px',
                  right: 0,
                  width: '280px',
                  background: '#FFFFFF',
                  border: '1px solid #E9E9EB',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 200,
                  padding: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #E9E9EB', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Notifications</span>
                    <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: '#FC8019', background: 'transparent' }}>Mark all read</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#A3A3A3', textAlign: 'center', padding: '12px 0' }}>No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '8px 4px',
                        borderBottom: '1px solid #F7F8FA',
                        fontSize: '0.75rem',
                        color: n.read ? '#A3A3A3' : '#1C1C1C',
                        fontWeight: n.read ? 400 : 600
                      }}>
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Offers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.25rem' }}>🎁</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#686B78' }}>Offers</span>
          </div>

          {/* Cart Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', position: 'relative' }}>
            <span style={{ fontSize: '1.25rem' }}>🛒</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#686B78' }}>Cart</span>
            {cartCount > 0 && (
              <span style={{
                background: '#FC8019',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                fontSize: '0.6rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: '-6px',
                left: '12px'
              }}>
                {cartCount}
              </span>
            )}
          </div>

          {/* User Profile Avatar / Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: '1px solid #E9E9EB',
            paddingLeft: '20px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #FC8019, #FF5A5F)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user ? user.substring(0, 2).toUpperCase() : 'G'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C1C1C', lineHeight: '1.2' }}>
                {user ? user : 'Guest'}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#A3A3A3', fontWeight: 500 }}>
                {user ? 'Logged In' : 'Visitor'}
              </span>
            </div>
            {user && (
              <button 
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  color: '#DC3545',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginLeft: '8px'
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
