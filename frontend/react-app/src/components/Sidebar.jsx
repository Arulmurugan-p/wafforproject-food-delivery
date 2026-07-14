import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ role, onLogout }) {
  const location = useLocation();

  let menuItems = [];

  if (role === 'ROLE_ADMIN') {
    menuItems = [
      { name: 'Admin Tasks', path: '/', icon: '🔑' },
      { name: 'My Orders (Admin)', path: '/orders', icon: '📋' }
    ];
  } else if (role === 'ROLE_DELIVERY_PARTNER') {
    menuItems = [
      { name: 'My Deliveries', path: '/', icon: '🛵' },
      { name: 'Order History', path: '/orders', icon: '📋' }
    ];
  } else {
    // Customer
    menuItems = [
      { name: 'Dashboard', path: '/', icon: '🏠' },
      { name: 'Browse Foods', path: '#', icon: '🍔', disabled: true },
      { name: 'My Orders', path: '/orders', icon: '📦' },
      { name: 'Profile', path: '#', icon: '👤', disabled: true },
      { name: 'Addresses', path: '#', icon: '📍', disabled: true },
      { name: 'Support', path: '#', icon: '📞', disabled: true }
    ];
  }

  return (
    <aside style={{
      width: '240px',
      background: '#FFFFFF',
      borderRight: '1px solid #E9E9EB',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      gap: '8px',
      height: 'calc(100vh - 72px)',
      position: 'sticky',
      top: '72px',
      zIndex: 90
    }}>
      {menuItems.map((item, idx) => {
        const isActive = location.pathname === item.path && !item.disabled;
        
        if (item.disabled) {
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                color: '#A3A3A3',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'not-allowed'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.name}</span>
            </div>
          );
        }

        return (
          <Link
            key={idx}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              color: isActive ? '#FC8019' : '#686B78',
              backgroundColor: isActive ? 'rgba(252, 128, 25, 0.08)' : 'transparent',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#F7F8FA';
                e.currentTarget.style.color = '#1C1C1C';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#686B78';
              }
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}

      {/* Logout button */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '10px',
          color: '#DC3545',
          background: 'transparent',
          fontSize: '0.9rem',
          fontWeight: 600,
          textAlign: 'left',
          width: '100%',
          marginTop: '8px'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FCE8E6'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ fontSize: '1.1rem' }}>🚪</span>
        <span>Logout</span>
      </button>

      {/* Promo Card: Only show for Customer */}
      {role !== 'ROLE_ADMIN' && role !== 'ROLE_DELIVERY_PARTNER' && (
        <div style={{
          marginTop: 'auto',
          background: 'linear-gradient(135deg, #FFF9F5, #FFF0E6)',
          border: '1px solid #FFE4D3',
          borderRadius: '16px',
          padding: '20px 16px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(252, 128, 25, 0.04)'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#C5221F', marginBottom: '4px' }}>Get 50% OFF</h4>
          <p style={{ fontSize: '0.75rem', color: '#686B78', fontWeight: 600 }}>on your first order</p>
          
          <div style={{
            background: '#FFFFFF',
            border: '1px dashed #FC8019',
            color: '#1C1C1C',
            borderRadius: '8px',
            padding: '6px',
            fontWeight: 700,
            fontSize: '0.8rem',
            margin: '12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            USE CODE: <span style={{ color: '#FC8019' }}>WELCOME50</span>
          </div>

          <span style={{ fontSize: '2.5rem', display: 'block', margin: '4px 0' }}>🛵</span>
          <p style={{ fontSize: '0.7rem', color: '#A3A3A3', lineHeight: '1.3' }}>Fast delivery at your doorstep</p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
