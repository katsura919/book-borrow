import React, { useState } from 'react';
import axios from 'axios';
import './BookBorrowForm.css'; // Import CSS

function BookBorrowForm() {
  const [borrowerType, setBorrowerType] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [books, setBooks] = useState([{ title: '', isbn: '' }]);

  const getBorrowLimit = (type) => {
    switch (type) {
      case 'student':
        return { maxBooks: 3, dueDays: 7 };
      case 'faculty':
        return { maxBooks: 10, dueDays: 120 }; // 1 semester (~120 days)
      case 'employee':
        return { maxBooks: 10, dueDays: 7 };
      default:
        return { maxBooks: 0, dueDays: 0 };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { maxBooks } = getBorrowLimit(borrowerType);

    if (books.length > maxBooks) {
      alert(`Exceeded the book limit! ${borrowerType}s can only borrow ${maxBooks} books.`);
      return;
    }

    if (
      !studentId || !firstName || !lastName || 
      !email || !contactNumber || books.some(book => !book.title || !book.isbn)
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
        borrowerType,
        books,
      });

      if (response.status === 201) {
        alert('Books borrowed successfully!');
        resetForm();
      } else {
        alert('Failed to borrow books.');
      }
    } catch (error) {
      console.error('Error:', error.response?.data?.message || error.message);
      alert('An error occurred while borrowing books.');
    }
  };

  const resetForm = () => {
    setStudentId('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setContactNumber('');
    setBooks([{ title: '', isbn: '' }]);
  };

  const handleBookChange = (index, field, value) => {
    const newBooks = [...books];
    newBooks[index][field] = value;
    setBooks(newBooks);
  };

  const handleAddBook = () => setBooks([...books, { title: '', isbn: '' }]);

  const handleRemoveBook = (index) => setBooks(books.filter((_, i) => i !== index));

  return (
    <form onSubmit={handleSubmit}>
      <h2>Book Borrowing Form</h2>

      <label>
        Borrower Type:
        <select value={borrowerType} onChange={(e) => setBorrowerType(e.target.value)}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="employee">Employee</option>
        </select>
      </label>

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
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </label>

      <label>
        Last Name:
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
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
            <button type="button" onClick={() => handleRemoveBook(index)}>
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={handleAddBook}>
        Add Another Book
      </button>

      <button type="submit">Borrow Books</button>
    </form>
  );
}

export default BookBorrowForm;
