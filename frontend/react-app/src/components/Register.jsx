import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
 
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        email,
        password
      });

      setSuccess(true);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
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
          Register Account
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#686B78',
          fontSize: '0.85rem',
          marginBottom: '24px'
        }}>
          Create a customer account to order food
        </p>

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

        {success && (
          <div style={{
            background: '#E8F5E9',
            border: '1px solid #C8E6C9',
            color: '#2E7D32',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            🎉 Account registered successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              placeholder="Minimum 6 characters"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#686B78' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#FC8019', fontWeight: 700 }}>
            Login Here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
