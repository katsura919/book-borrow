import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Overview.css'; // Assuming you will add styles here

function Overview() {
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    overdue: 0,
  });

  const fetchRequestCounts = async () => {
    try {
      const response = await axios.get('http://localhost:4000/request-counts'); // Adjust the URL as needed
      setCounts(response.data);
    } catch (error) {
      console.error('Error fetching request counts:', error);
    }
  };

  useEffect(() => {
    fetchRequestCounts();
  }, []);

  return (
    <div className="overview-container">
      <header className="overview-header">
        <h1>Overview</h1>
      </header>
      <div className="card-container">
        <div className="card">
          <h3 style={{color:'#262424'}}>Pending Requests</h3>
          <p>{counts.pending}</p>
        </div>
        <div className="card">
          <h3 style={{color:'#262424'}}>Approved Requests</h3>
          <p>{counts.approved}</p>
        </div>
        <div className="card">
          <h3 style={{color:'#262424'}}>Rejected Requests</h3>
          <p>{counts.rejected}</p>
        </div>
        <div className="card">
          <h3 style={{color:'#262424'}}>Overdue Requests</h3>
          <p>{counts.overdue}</p>
        </div>
      </div>
    </div>
  );
}

export default Overview;
