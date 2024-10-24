import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Tables.css';
import './BookReq.css'

const ENTRIES_PER_PAGE = 3; // Change this number to show more/less entries per page

function BookReq() {
  const [bookRequests, setBookRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchType, setFetchType] = useState('all-req')
  const [selectedOption, setSelectedOption] = useState('All');

  const fetchBookRequests = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/${fetchType}`);
      setBookRequests(response.data);
    } catch (error) {
      console.error('Error fetching book requests:', error);
    }
  };

   // Re-fetch book requests when fetchType changes
   useEffect(() => {
    fetchBookRequests();
  }, [fetchType]);

  
  // Call fetchBookRequests on component mount
  useEffect(() => {
    fetchBookRequests();
  }, []);

  const handleApprove = async (reqId) => {
    try {
      const response = await axios.post('http://localhost:4000/approve-request', { reqId });
      if (response.status === 200) {
        alert('Request approved successfully!');
        fetchBookRequests(); // Refresh the list after approving
      }
    } catch (error) {
      console.error('Error approving the request:', error);
      alert('Failed to approve the request.');
    }
  };

  const handleDecline = async (reqId) => {
    try {
      const response = await axios.post('http://localhost:4000/reject-request', { reqId });
      if (response.status === 200) {
        alert('Request declined successfully!');
        fetchBookRequests(); // Refresh the list after declining
      }
    } catch (error) {
      console.error('Error declining the request:', error);
      alert('Failed to decline the request.');
    }
  };

  // Function to handle the search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Filtered book requests based on the search term
  const filteredRequests = bookRequests.filter(request =>
    `${request.borrower.first_name} ${request.borrower.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / ENTRIES_PER_PAGE);
  const indexOfLastRequest = currentPage * ENTRIES_PER_PAGE;
  const indexOfFirstRequest = indexOfLastRequest - ENTRIES_PER_PAGE;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);


 

  const handleChange = (event) => {
    setSelectedOption(event.target.value);
  }
  return (
    <div className="home-container">
      <div>
        <header className="content-header">
          <h1>All Requests</h1>
        </header>
      </div>
      <input
        type="text"
        placeholder="Search by Name"
        value={searchTerm}
        onChange={handleSearchChange}
      />

      
      <div className="radio-inputs">
        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="All"
            checked={selectedOption === "All"}
            onChange={(e) => {
              handleChange(e);
              setFetchType('all-req');
            }}
          />
          <span className="name">All</span>
        </label>

        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="Pending"
            checked={selectedOption === "Pending"}
            onChange={(e) => {
              handleChange(e);
              setFetchType('pending-req');
            }}
          />
          <span className="name">Pending</span>
        </label>

        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="Approved"
            checked={selectedOption === "Approved"}
            onChange={(e) => {
              handleChange(e);
              setFetchType('approved-req');
            }}
          />
          <span className="name">Approved</span>
        </label>

        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="Rejected"
            checked={selectedOption === "Rejected"}
            onChange={(e) => {
              handleChange(e);
              setFetchType('rejected-req');
            }}
          />
          <span className="name">Rejected</span>
        </label>

        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="Overdue"
            checked={selectedOption === "Overdue"}
            onChange={(e) => {
              handleChange(e);
              setFetchType('overdue-req');
            }}
          />
          <span className="name">Overdue</span>
        </label>
      </div>

      {/* Tables */}      
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Request Created</th>
              <th>Approval Date</th>
              <th>Due Date</th>
              <th>Day/s Overdue</th>
              <th>Books</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRequests.map((request) => (
              <tr key={request.req_id}>
                <td>{request.req_id}</td>
                <td>{`${request.borrower.first_name} ${request.borrower.last_name}`}</td>
                <td>{request.borrower.borrower_type}</td>
                <td>{request.status}</td>
                <td>{request.req_created}</td>
                <td>{request.req_approve || 'N/A'}</td>
                <td>{request.books.length > 0 ? request.books[0].due_date : 'N/A'}</td>
                <td>{request.overdue_days > 0 ? `${request.overdue_days} days` : '0 Days'}</td>
                <td>
                  <ul>
                    {request.books.map((book) => (
                      <li key={book.book_id}>
                        {book.title}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <div className='btn-container'>
                    <button
                      onClick={() => handleApprove(request.req_id)}
                      disabled={request.status === 'Approved' || request.status === 'Overdue'}
                      className={request.status === 'Approved' ? 'Approved' : 'approve-button'}
                    >
                      {request.status === 'Approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleDecline(request.req_id)}
                      disabled={request.status === 'Rejected' || request.status === 'Overdue'}
                      className={request.status === 'Rejected' ? 'Rejected' : 'reject-button'}
                    >
                      {request.status === 'Rejected' ? 'Rejected' : 'Reject'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
      <div className="pagination">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || currentRequests.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default BookReq;
