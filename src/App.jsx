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
        {/* If the user is logged in, redirect to dashboard, otherwise login */}
        <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
        
        {/* Protected route, accessible only when token exists */}
        <Route path="/dashboard" element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} >
        <Route path="profile" element={ <Profile />} />
          <Route path="bookreq" element={<BookReq />} />
          <Route path="approved" element={<ApprovedReq />} />
          <Route path="declined" element={<DeclinedReq />} />
        </Route>
        
        {/* Default route */}
        <Route path="/" element={token ? <Dashboard token={token} onLogout={handleLogout}/>: <Layout />}>
          <Route path="/" element={!token ? <LandingPage /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/checkout" element={<BookBorrowForm />} />
          <Route path="/about" element={<AboutUs />} />
        </Route>
        
   
      </Routes>
    </Router>
  );
}

export default App;
