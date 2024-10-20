import React from 'react'
import { useEffect, useState } from 'react';
import axios from 'axios';
import './Tables.css'

function ApprovedReq() {

  const [approvedRequests, setapprovedRequests] = useState([]);

  useEffect(() => {
    const fetchApprovedRequests = async () => {
      try {
        const response = await axios.get('http://localhost:4000/approved-req');
        setapprovedRequests(response.data);
      } catch (error) {
        console.error('Error fetching book requests:', error);
      }
    };

    fetchApprovedRequests();
  }, []);


  return (
    <div className="home-container">
     
      <div className="table-responsive"> {/* Wrapper for the table */}
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Student ID</th>
              <th>Borrow Date</th>
              <th>Status</th>
              <th>Return Date</th>
              <th>Request Created Date</th>
            </tr>
          </thead>
          <tbody>
            {approvedRequests.map((request) => (
              <tr key={request.req_id}>
                <td>{request.req_id}</td>
                <td>{request.borrower_id}</td>
                <td>{request.req_approve}</td>
                <td>{request.status}</td>
                <td>{request.return_date || 'Not Returned'}</td>
                <td>{request.req_created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApprovedReq;