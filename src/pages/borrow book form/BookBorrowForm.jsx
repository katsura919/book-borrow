import React, { useState } from 'react';
import axios from 'axios';
import './BookBorrowForm.css'; // Import CSS

function BookBorrowForm() {
  const [studentId, setStudentId] = useState('');
  const [firstName, setfirstName] = useState('');
  const [lastName, setlastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [books, setBooks] = useState([{ title: '', isbn: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !studentId || !firstName || 
      !lastName || !email || !contactNumber || books.some(book => !book.title || !book.isbn)
    ) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/borrow', {
        studentId,
        firstName,
        lastName,
        email,
        contactNumber,
        books,
      });

      if (response.status === 201) {
        alert('Books borrowed successfully!');
        setStudentId('');
        setfirstName('');
        setlastName('');
        setEmail('');
        setContactNumber('');
        setBooks([{ title: '', isbn: '' }]);
      } else {
        alert('Failed to borrow books.');
      }
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.response.data.message);
        alert(`Error: ${error.response.data.message}`);
      } else {
        console.error('Network error:', error);
        alert('An error occurred while borrowing books.');
      }
    }
  };

  
  const handleBookChange = (index, field, value) => {
    const newBooks = [...books];
    newBooks[index][field] = value;
    setBooks(newBooks);
  };

  const handleAddBook = () => {
    setBooks([...books, { title: '', isbn: '' }]);
  };

  const handleRemoveBook = (index) => {
    const newBooks = books.filter((_, i) => i !== index);
    setBooks(newBooks);
  };

  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Book Borrowing Form</h2>

      <label>
        Student ID:
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      </label>

      <label>
        First Name:
        <input
          type="text"
          value={firstName}
          onChange={(e) => setfirstName(e.target.value)}
          required
        />
      </label>

      <label>
        Last Name:
        <input
          type="text"
          value={lastName}
          onChange={(e) => setlastName(e.target.value)}
          required
        />
      </label>

      <label>
        Email:
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label>
        Contact Number:
        <input
          type="text"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          required
        />
      </label>

      <h3>Books to Borrow:</h3>
      {books.map((book, index) => (
        <div key={index} className="book-input">
          <input
            type="text"
            value={book.title}
            onChange={(e) => handleBookChange(index, 'title', e.target.value)}
            placeholder={`Book ${index + 1} Title`}
            required
          />
          <input
            type="text"
            value={book.isbn}
            onChange={(e) => handleBookChange(index, 'isbn', e.target.value)}
            placeholder={`Book ${index + 1} ISBN`}
            required
          />
          {index > 0 && (
            <button className="button-remove" onClick={() => handleRemoveBook(index)}>
              Remove
            </button>
          )}
        </div>
      ))}
      <button className="button-add" onClick={handleAddBook}>
        Add Another Book
      </button>

      <button className="button-submit" type="submit">Borrow Books</button>
    </form>
  );
}

export default BookBorrowForm;
