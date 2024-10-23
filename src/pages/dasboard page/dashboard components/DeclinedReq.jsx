import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Tables.css';

const ENTRIES_PER_PAGE = 5; // Change this number to show more/less entries per page

function DeclinedReq() {
  const [bookRequests, setBookRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBookRequests = async () => {
    try {
      const response = await axios.get('http://localhost:4000/rejected-req');
      setBookRequests(response.data);
    } catch (error) {
      console.error('Error fetching book requests:', error);
    }
  };

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
      const response = await axios.post('http://localhost:4000/decline-request', { reqId });
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
    request.borrower_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / ENTRIES_PER_PAGE);
  const indexOfLastRequest = currentPage * ENTRIES_PER_PAGE;
  const indexOfFirstRequest = indexOfLastRequest - ENTRIES_PER_PAGE;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  return (
    <div className="home-container">

      <div>
        <header className="content-header">
          <h1>Rejected Requests</h1>
        </header>
      </div>

      <input
        type="text"
        placeholder="Search by Borrower ID"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Borrower ID</th>
              <th>Status</th>
              <th>Request Created</th>
              <th>Books</th>
      
              <th>Change Status</th>
            </tr>
          </thead>
          <tbody>
            {currentRequests.map((request) => (
              <tr key={request.req_id}>
                <td>{request.req_id}</td>
                <td>{request.borrower_id}</td>
                <td>{request.status}</td>
                <td>{request.req_created}</td>
                <td>
                  <ul>
                    {request.books.map((book) => (
                      <li key={book.book_id}>
                        {book.title} (ISBN: {book.isbn}) {/* Removed due date from here */}
                      </li>
                    ))}
                  </ul>
                </td>

                <td>
                  <button
                    onClick={() => handleApprove(request.req_id)}
                    disabled={request.status === 'approved'}
                    className={request.status === 'approved' ? 'approved' : 'approve-button'}
                  >
                    {request.status === 'approved' ? 'Approved' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleDecline(request.req_id)}
                    disabled={request.status === 'declined'}
                    className={request.status === 'declined' ? 'declined' : 'decline-button'}
                  >
                    {request.status === 'declined' ? 'Rejected' : 'Reject'}
                  </button>
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

export default DeclinedReq;
