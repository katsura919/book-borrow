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
          <h2>Pending Requests</h2>
          <p>{counts.pending}</p>
        </div>
        <div className="card">
          <h2>Approved Requests</h2>
          <p>{counts.approved}</p>
        </div>
        <div className="card">
          <h2>Rejected Requests</h2>
          <p>{counts.rejected}</p>
        </div>
        <div className="card">
          <h2>Overdue Requests</h2>
          <p>{counts.overdue}</p>
        </div>
      </div>
    </div>
  );
}

export default Overview;
