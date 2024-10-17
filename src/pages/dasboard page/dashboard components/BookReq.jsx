import React from 'react'
import { useEffect, useState } from 'react';
import axios from 'axios';
import './Tables.css'

function BookReq() {

  const [bookRequests, setBookRequests] = useState([]);

  useEffect(() => {
    const fetchBookRequests = async () => {
      try {
        const response = await axios.get('http://localhost:4000/book-requests');
        setBookRequests(response.data);
      } catch (error) {
        console.error('Error fetching book requests:', error);
      }
    };

    fetchBookRequests();
  }, []);


  const handleApprove = async (reqId) => {
    try {
      const response = await axios.post(`http://localhost:4000/approve-request`, { reqId });
      if (response.status === 200) {
        // Optionally, you can show a success message
        alert('Request approved successfully!');
        // Refresh the book requests
    
      }
    } catch (error) {
      console.error('Error approving the request:', error);
      alert('Failed to approve the request.');
    }
  };
  
  const handleDecline = async (reqId) => {
    try {
      const response = await axios.post(`http://localhost:4000/decline-request`, { reqId });
      if (response.status === 200) {
        // Optionally, you can show a success message
        alert('Request declined successfully!');
        // Refresh the book requests
    
      }
    } catch (error) {
      console.error('Error declining the request:', error);
      alert('Failed to decline the request.');
    }
  };

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
              <th>Change Status</th>
            </tr>
          </thead>
          <tbody>
            {bookRequests.map((request) => (
              <tr key={request.req_id}>
                <td>{request.req_id}</td>
                <td>{request.student_id}</td>
                <td>{request.borrow_date}</td>
                <td>{request.status}</td>
                <td>{request.return_date || 'Not Returned'}</td>
                <td>{request.req_created}</td>
                <td>
                  <button 
                    onClick={() => handleApprove(request.req_id)} 
                    disabled={request.status === 'approved'} // Disable if already approved
                    className={request.status === 'approved' ? 'approved' : 'approve-button'}
                  >
                    {request.status === 'approved' ? 'Approved' : 'Approve'}
                  </button>

                  <button 
                    onClick={() => handleDecline(request.req_id)} 
                    disabled={request.status === 'declined'} // Disable if already approved
                    className={request.status === 'declined' ? 'declined' : 'decline-button'}
                  >
                    {request.status === 'declined' ? 'Declined' : 'Decline'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookReq