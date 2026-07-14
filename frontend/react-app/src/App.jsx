import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import MyOrders from './components/MyOrders';
import OrderTracking from './components/OrderTracking';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('username'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [cart, setCart] = useState([]);

  // Fetch cart from database when token/role changes
  const fetchCart = async () => {
    if (!token || role !== 'ROLE_CUSTOMER') {
      setCart([]);
      return;
    }
    try {
      const response = await axios.get('http://localhost:8081/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (err) {
      console.error('Failed to fetch cart from backend:', err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token, role]);

  // Cart Management Actions (Synchronized with DB)
  const addToCart = async (item) => {
    if (!token) return;
    try {
      const response = await axios.post('http://localhost:8081/api/cart/add', item, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (itemName, delta) => {
    if (!token) return;
    try {
      const response = await axios.post('http://localhost:8081/api/cart/update', { name: itemName, delta }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (itemName) => {
    if (!token) return;
    try {
      const response = await axios.post('http://localhost:8081/api/cart/remove', { name: itemName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      await axios.post('http://localhost:8081/api/cart/clear', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart([]);
    } catch (err) {
      console.error(err);
    }
  };

  const login = (jwtToken, username, userRole) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('username', username);
    localStorage.setItem('role', userRole);
    setToken(jwtToken);
    setUser(username);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    setRole(null);
    setCart([]);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>
        <Navbar token={token} user={user} onLogout={logout} cartCount={totalCartCount} />
        
        <div className="layout-container">
          {token && <Sidebar role={role} onLogout={logout} />}
          
          <div className="main-content-wrapper" style={{ width: '100%' }}>
            <Routes>
              {/* Authenticated route checks */}
              {!token ? (
                <>
                  <Route path="/login" element={<Login onLogin={login} />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<Navigate to="/login" />} />
                </>
              ) : (
                <>
                  <Route 
                    path="/" 
                    element={
                      <Dashboard 
                        token={token}
                        role={role}
                        user={user}
                        cart={cart}
                        addToCart={addToCart}
                        updateQuantity={updateQuantity}
                        removeFromCart={removeFromCart}
                        clearCart={clearCart}
                      />
                    } 
                  />
                  <Route path="/orders" element={<MyOrders token={token} role={role} />} />
                  <Route path="/track/:orderId" element={<OrderTracking token={token} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
