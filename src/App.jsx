import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/landing page/Login';
import Register from './pages/landing page/Register';
import Dashboard from './pages/dasboard page/Dashboard';
import LandingPage from './pages/landing page/LandingPage';
import BookBorrowForm from './pages/borrow book form/BookBorrowForm'
import Layout from './Layout';
import AboutUs from './pages/landing page/AboutUs';
import Profile from './pages/dasboard page/dashboard components/Profile';
import BookReq from './pages/dasboard page/dashboard components/BookReq'
import ApprovedReq from './pages/dasboard page/dashboard components/ApprovedReq';
import DeclinedReq from './pages/dasboard page/dashboard components/DeclinedReq';
import Overview from './pages/dasboard page/dashboard components/Overview'
import OverdueReq from './pages/dasboard page/dashboard components/OverdueReq'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token); // Store token in localStorage
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
            <Routes>
              {/* Login and Register Routes */}
              <Route 
                path="/login" 
                element={!token ? <Login setToken={setToken} /> : <Navigate to="/dashboard" />} 
              />
              <Route 
                path="/register" 
                element={!token ? <Register /> : <Navigate to="/dashboard" />} 
              />

              {/* Protected Dashboard Route */}
              <Route 
                path="/dashboard" 
                element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" />}
              >
                {/* Default Route: Redirect to Overview */}
                <Route index element={<Navigate to="overview" />} />

                {/* Dashboard Subpages */}
                <Route path="profile" element={<Profile />} />
                <Route path="bookreq" element={<BookReq />} />
                <Route path="approved" element={<ApprovedReq />} />
                <Route path="declined" element={<DeclinedReq />} />
                <Route path="overview" element={<Overview />} />
                <Route path="overdue" element={<OverdueReq />} />
              </Route>

              {/* Default Route and Public Pages */}
              <Route 
                path="/" 
                element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Layout />}
              >
                <Route index element={!token ? <LandingPage /> : <Navigate to="/dashboard" />} />
                <Route path="/checkout" element={<BookBorrowForm />} />
                <Route path="/about" element={<AboutUs />} />
              </Route>
            </Routes>
    </Router>

  );
}

export default App;
