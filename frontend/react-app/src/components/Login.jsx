import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState('CUSTOMER'); // CUSTOMER, DELIVERY_PARTNER, ADMIN
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password
      });
      
      const { token, username: resUser, role: resRole } = response.data;
      
      // Check if role matches selected tab (mapping ROLE_CUSTOMER to CUSTOMER)
      const mappedRole = resRole.replace('ROLE_', '');
      if (mappedRole !== activeTab) {
        setError(`Invalid credentials for ${activeTab} login. User is registered as ${mappedRole}.`);
        setLoading(false);
        return;
      }

      onLogin(token, resUser, resRole);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const getTabStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      flex: 1,
      padding: '12px 6px',
      textAlign: 'center',
      fontWeight: 700,
      fontSize: '0.85rem',
      cursor: 'pointer',
      borderBottom: isActive ? '3px solid #FC8019' : '1px solid #E9E9EB',
      color: isActive ? '#FC8019' : '#686B78',
      transition: 'all 0.2s'
    };
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '30px',
      paddingBottom: '30px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', background: '#FFFFFF' }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '6px',
          fontWeight: 800,
          fontSize: '1.5rem',
          color: '#1C1C1C'
        }}>
          Mummy's Foods
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#686B78',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          Food Order & Delivery Portal
        </p>

        {/* Tab Headers */}
        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <div onClick={() => { setActiveTab('CUSTOMER'); setError(null); }} style={getTabStyle('CUSTOMER')}>Customer</div>
          <div onClick={() => { setActiveTab('DELIVERY_PARTNER'); setError(null); }} style={getTabStyle('DELIVERY_PARTNER')}>Courier Partner</div>
          <div onClick={() => { setActiveTab('ADMIN'); setError(null); }} style={getTabStyle('ADMIN')}>Admin</div>
        </div>

        {error && (
          <div style={{
            background: '#FCE8E6',
            border: '1px solid #FAD2CF',
            color: '#C5221F',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`Enter your ${activeTab.toLowerCase().replace('_', ' ')} username`}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Logging in...' : `Login as ${activeTab.replace('_', ' ')}`}
          </button>
        </form>

        {activeTab === 'CUSTOMER' && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#686B78' }}>
            New Customer?{' '}
            <Link to="/register" style={{ color: '#FC8019', fontWeight: 700 }}>
              Register Here
            </Link>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #E9E9EB',
          fontSize: '0.75rem',
          color: '#A3A3A3',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          💡 Quick Credentials Seeded:<br/>
          • Customer: <strong>customer</strong> / <strong>customer123</strong><br/>
          • Courier: <strong>delivery</strong> / <strong>delivery123</strong><br/>
          • Admin: <strong>admin</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}

export default Login;
