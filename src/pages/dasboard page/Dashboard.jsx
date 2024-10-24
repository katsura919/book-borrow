import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ token, onLogout }) {
  const [message, setMessage] = useState('');
  const [dashboardTitle, setdashboardTitle] = useState('Dashboard');
  const navigate = useNavigate();
  const location = useLocation(); // Get the current route path

  useEffect(() => {
    // Fetch dashboard data on load
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:4000/dashboard', {
          headers: { Authorization: token },
        });
        setMessage(response.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      }
    };
    fetchData();

    // Redirect to overview only if the current path is exactly '/dashboard'
    if (location.pathname === '/dashboard') {
      navigate('/dashboard/overview');
    }
  }, [token, navigate, location]);

  const handleLogout = () => {
    onLogout(); // Clear token
    navigate('/login'); // Redirect to login
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className='dashboard-title'>Book Master</h2>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard/overview')}>Overview</li>
          <li onClick={() => navigate('/dashboard/bookreq')}>All Request</li>
          <li onClick={() => navigate('/dashboard/approved')}>Approved Requests</li>
          <li onClick={() => navigate('/dashboard/declined')}>Rejected Requests</li>
          <li onClick={() => navigate('/dashboard/overdue')}>Overdue Requests</li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </div>
   
        <div className="dashboard-content">
          <Outlet /> {/* Render the nested route here */}
        </div>
    </div>
  );
}

export default Dashboard;
