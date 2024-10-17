import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <h2>Navigation</h2>
      <ul>
        <li onClick={() => navigate('/dashboard')}>Dashboard</li>
        <li onClick={() => navigate('/dashboard/profile')}>Profile</li>
        <li onClick={() => navigate('/dashboard/settings')}>Settings</li>
      </ul>
    </div>
  );
};

export default Sidebar;
