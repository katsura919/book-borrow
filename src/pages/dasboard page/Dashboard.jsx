import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Outlet, useNavigate } from 'react-router-dom';
import './Dashboard.css'

function Dashboard({ token, onLogout }) {
  const [message, setMessage] = useState('');
  const [dashboardTitle, setdashboardTitle] = useState('Dashboard');
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [token]);

  // Logout function
  const handleLogout = () => {
    onLogout();  // Call the onLogout function from props to clear token
    navigate('/login'); // Redirect to login page
  };

  

  // Toggles the sidebar open/close
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const gotoBookReq = () => {
    navigate('/dashboard/bookreq');
    setdashboardTitle('Book Request');
  };
  
  const gotoBookDashboard = () => {
    navigate('/dashboard');
    setdashboardTitle('Dashboard');
  };

  const gotoApprovedReq = () => {
    navigate('/dashboard/approved');
    setdashboardTitle('Approved Request');
  };

  const gotoDeclinedReq = () => {
    navigate('/dashboard/declined');
    setdashboardTitle('Declined Request');
  };
  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Book Master</h2>
        </div>
        <ul className="sidebar-menu">
          <li onClick={gotoBookDashboard}>Dashboard</li>
          <li onClick={gotoBookReq}>Book Request</li>
          <li onClick={gotoApprovedReq}>Approved Requests</li>
          <li onClick={gotoDeclinedReq}>Declined Requests</li>
          <li onClick={() => navigate('/dashboard/settings')}>Settings</li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </div>


      <div className="dashboard-content">
        <header className="content-header">
          <h1>{dashboardTitle}</h1>
        </header>
        <div className="content-main">
          {/* Render the child routes here */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
