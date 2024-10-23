
// server.js
import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors({
    origin: 'http://localhost:5173' // Your React app URL
  }));
app.use(bodyParser.json());

const SECRET_KEY = 'aassaassaassaassaassaassaassaassaassaass';

// Connect to SQLite database
const db = new sqlite3.Database('LMS.db'); // Or use a file for persistence: './database.sqlite'



db.serialize(() => {
  // Create Admin Table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      admin_id INTEGER PRIMARY KEY AUTOINCREMENT, 
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL, 
      username TEXT NOT NULL UNIQUE, 
      password TEXT NOT NULL
    );
  `);

  // Create Borrowers Table
  db.run(`
    CREATE TABLE IF NOT EXISTS borrowers (
      borrower_id VARCHAR(20) PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email VARCHAR(100) NOT NULL,
      contact_number VARCHAR(100) NOT NULL,
      borrower_type TEXT NOT NULL 
      CHECK (borrower_type IN ('student', 'faculty', 'employee'))
    );
  `);

  // Create Book Requests Table
  db.run(`
    CREATE TABLE IF NOT EXISTS book_reqsts (
      req_id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower_id VARCHAR(20) NOT NULL,
      status TEXT DEFAULT 'Pending',
      req_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      req_approve DATETIME DEFAULT NULL,
      FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id) ON DELETE CASCADE
    );
  `);

  // Create Borrowed Books Table
  db.run(`
    CREATE TABLE IF NOT EXISTS borrowed_books (
      book_id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      isbn VARCHAR(20) NOT NULL,
      due_date DATE,
      FOREIGN KEY (req_id) REFERENCES book_reqsts(req_id) ON DELETE CASCADE
    );
  `);
});


// Landing Page APIs
  // User Registration
app.post('/register', (req, res) => {
  const { firstName, lastName, username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing username or password');
  
  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insert user into database
  db.run('INSERT INTO admin (firstName, lastName, username, password) VALUES (?, ?, ?, ?)', [firstName, lastName, username, hashedPassword], function (err) {
    if (err) return res.status(500).send('Error registering user');
    res.status(201).send('User registered');
  });
});

// User Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing username or password');

  db.get('SELECT * FROM admin WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(402).send('Invalid Username');

    // Check password
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) return res.status(401).send('Invalid Password');

    // Create a JWT token
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
  });
});

// Request a book
app.post('/borrow', (req, res) => {
  const { studentId, firstName, lastName, email, contactNumber, borrowerType, books } = req.body;

  // Validate required fields
  if (!studentId || !firstName || !lastName || !email || !contactNumber || !borrowerType || !books.length) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Validate borrower type
  const validTypes = ['student', 'faculty', 'employee'];
  if (!validTypes.includes(borrowerType)) {
    return res.status(400).json({ message: 'Invalid borrower type.' });
  }

  // Define book limits per borrower type
  const rules = {
    student: { maxBooks: 3 },
    faculty: { maxBooks: 10 },
    employee: { maxBooks: 10 },
  };

  const { maxBooks } = rules[borrowerType];

  // Enforce book limit
  if (books.length > maxBooks) {
    return res.status(400).json({ message: `${borrowerType}s can only borrow up to ${maxBooks} books.` });
  }

  // Step 1: Insert or Update Borrower Info in `borrowers` Table
  db.run(
    `INSERT INTO borrowers (borrower_id, first_name, last_name, email, contact_number, borrower_type) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(borrower_id) DO UPDATE SET 
     first_name = excluded.first_name, 
     last_name = excluded.last_name, 
     email = excluded.email, 
     contact_number = excluded.contact_number,
     borrower_type = excluded.borrower_type`,
    [studentId, firstName, lastName, email, contactNumber, borrowerType],
    function (err) {
      if (err) {
        console.error('Error inserting/updating borrower:', err.message);
        return res.status(500).json({ message: 'Error saving borrower info' });
      }

      // Step 2: Insert Borrow Request in `book_reqsts` Table
      db.run('INSERT INTO book_reqsts (borrower_id) VALUES (?)', [studentId], function (err) {
        if (err) {
          console.error('Error creating borrow request:', err.message);
          return res.status(500).json({ message: 'Error creating borrow request' });
        }

        const borrowId = this.lastID;

        // Step 3: Bulk Insert Books into `borrowed_books` Table with `due_date` set to null
        const insertBooks = books.map((book) => {
          return new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO borrowed_books (req_id, title, isbn, due_date) VALUES (?, ?, ?, ?)',
              [borrowId, book.title, book.isbn, null],  // Leave due_date as null
              function (err) {
                if (err) {
                  console.error('Error inserting borrowed book:', err.message);
                  return reject(err);
                }
                resolve();
              }
            );
          });
        });

        // Wait for all books to be inserted
        Promise.all(insertBooks)
          .then(() => {
            res.status(201).json({ message: 'Borrow request successfully registered.' });
          })
          .catch((err) => {
            console.error('Error inserting books:', err.message);
            res.status(500).json({ message: 'Error registering borrowed books.' });
          });
      });
    }
  );
});





// Dashboard APIs
  // Show Requests
  // Show all book requests
app.get('/book-requests', (req, res) => {
  const query = `
    SELECT 
      br.req_id,
      br.borrower_id,
      br.status,
      br.req_created,
      br.req_approve,
      bo.first_name,
      bo.last_name,
      bo.borrower_type,
      bb.book_id,
      bb.title,
      bb.isbn,
      bb.due_date
    FROM book_reqsts br
    JOIN borrowers bo ON br.borrower_id = bo.borrower_id
    LEFT JOIN borrowed_books bb ON br.req_id = bb.req_id
    WHERE br.status = 'Pending'
    ORDER BY br.req_created DESC;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching book requests:', err.message);
      return res.status(500).json({ message: 'Error retrieving book requests' });
    }

    // Group requests with their corresponding books
    const groupedData = rows.reduce((acc, row) => {
      const { req_id, borrower_id, status, req_created, req_approve, first_name, last_name, borrower_type } = row;

      if (!acc[req_id]) {
        acc[req_id] = {
          req_id,
          borrower_id,
          borrower_name: `${first_name} ${last_name}`,
          borrower_type,
          status,
          req_created,
          req_approve,
          books: []
        };
      }

      if (row.book_id) {
        acc[req_id].books.push({
          book_id: row.book_id,
          title: row.title,
          isbn: row.isbn,
          due_date: row.due_date
        });
      }

      return acc;
    }, {});

    // Convert grouped data to an array
    const result = Object.values(groupedData);

    res.status(200).json(result);
  });
});

  // Show all approved requests
app.get('/approved-req', (req, res) => {
  const query = `
    SELECT 
      br.req_id,
      br.borrower_id,
      br.status,
      br.req_created,
      br.req_approve,
      bo.first_name,
      bo.last_name,
      bo.borrower_type,
      bb.book_id,
      bb.title,
      bb.isbn,
      bb.due_date
    FROM book_reqsts br
    JOIN borrowers bo ON br.borrower_id = bo.borrower_id
    LEFT JOIN borrowed_books bb ON br.req_id = bb.req_id
    WHERE br.status = 'Approved'
    ORDER BY br.req_created DESC;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching book requests:', err.message);
      return res.status(500).json({ message: 'Error retrieving book requests' });
    }

    // Group requests with their corresponding books
    const groupedData = rows.reduce((acc, row) => {
      const { req_id, borrower_id, status, req_created, req_approve, first_name, last_name, borrower_type } = row;

      if (!acc[req_id]) {
        acc[req_id] = {
          req_id,
          borrower_id,
          borrower_name: `${first_name} ${last_name}`,
          borrower_type,
          status,
          req_created,
          req_approve,
          books: []
        };
      }

      if (row.book_id) {
        acc[req_id].books.push({
          book_id: row.book_id,
          title: row.title,
          isbn: row.isbn,
          due_date: row.due_date
        });
      }

      return acc;
    }, {});

    // Convert grouped data to an array
    const result = Object.values(groupedData);

    res.status(200).json(result);
  });
});

  //Show all declined requests
app.get('/rejected-req', (req, res) => {
  const query = `
    SELECT 
      br.req_id,
      br.borrower_id,
      br.status,
      br.req_created,
      br.req_approve,
      bo.first_name,
      bo.last_name,
      bo.borrower_type,
      bb.book_id,
      bb.title,
      bb.isbn,
      bb.due_date
    FROM book_reqsts br
    JOIN borrowers bo ON br.borrower_id = bo.borrower_id
    LEFT JOIN borrowed_books bb ON br.req_id = bb.req_id
    WHERE br.status = 'Rejected'
    ORDER BY br.req_created DESC;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching book requests:', err.message);
      return res.status(500).json({ message: 'Error retrieving book requests' });
    }

    // Group requests with their corresponding books
    const groupedData = rows.reduce((acc, row) => {
      const { req_id, borrower_id, status, req_created, req_approve, first_name, last_name, borrower_type } = row;

      if (!acc[req_id]) {
        acc[req_id] = {
          req_id,
          borrower_id,
          borrower_name: `${first_name} ${last_name}`,
          borrower_type,
          status,
          req_created,
          req_approve,
          books: []
        };
      }

      if (row.book_id) {
        acc[req_id].books.push({
          book_id: row.book_id,
          title: row.title,
          isbn: row.isbn,
          due_date: row.due_date
        });
      }

      return acc;
    }, {});

    // Convert grouped data to an array
    const result = Object.values(groupedData);

    res.status(200).json(result);
  });
});

// Buttons
  // Approve a request
app.post('/approve-request', (req, res) => {
  const { reqId } = req.body;

  // Query to get the borrower type based on the request ID
  const getBorrowerTypeQuery = `
    SELECT borrowers.borrower_type
    FROM book_reqsts
    JOIN borrowers ON book_reqsts.borrower_id = borrowers.borrower_id
    WHERE book_reqsts.req_id = ?
  `;

  // Define due days per borrower type
  const rules = {
    student: 7, // 7 days
    faculty: 120, // 1 semester (~120 days)
    employee: 7, // 7 days
  };

  db.get(getBorrowerTypeQuery, [reqId], (err, row) => {
    if (err) {
      console.error('Error fetching borrower type:', err.message);
      return res.status(500).json({ message: 'Error fetching borrower type' });
    }

    if (!row) {
      return res.status(404).json({ message: 'Request or borrower not found.' });
    }

    const dueDays = rules[row.borrower_type];

    // Calculate the due date based on the current date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Step 1: Update the request status and approval date
    db.run(
      'UPDATE book_reqsts SET status = ?, req_approve = CURRENT_TIMESTAMP WHERE req_id = ?',
      ['Approved', reqId],
      function (err) {
        if (err) {
          console.error('Error updating book request status:', err.message);
          return res.status(500).json({ message: 'Error updating book request status' });
        }

        // Step 2: Update the due date in the borrowed_books table
        db.run(
          'UPDATE borrowed_books SET due_date = ? WHERE req_id = ?',
          [formattedDueDate, reqId],
          function (err) {
            if (err) {
              console.error('Error updating due date:', err.message);
              return res.status(500).json({ message: 'Error updating due date' });
            }

            // Respond with success
            res.status(200).json({ message: 'Book request approved successfully' });
          }
        );
      }
    );
  });
});

  // Decline a request
app.post('/decline-request', (req, res) => {
  const { reqId } = req.body;

  // Update the status of the request in the database
  db.run('UPDATE book_reqsts SET status = ? WHERE req_id = ?', ['Rejected', reqId], function(err) {
    if (err) {
      console.error('Error updating book request status:', err.message);
      return res.status(500).json({ message: 'Error updating book request status' });
    }

    // Respond with success
    res.status(200).json({ message: 'Book request approved successfully' });
  });
});


//Overview

app.get('/request-counts', (req, res) => {
  db.all('SELECT status, COUNT(*) AS count FROM book_reqsts GROUP BY status', [], (err, rows) => {
    if (err) {
      console.error('Error fetching request counts:', err.message);
      return res.status(500).json({ message: 'Error fetching request counts' });
    }

    const counts = { pending: 0, approved: 0, rejected: 0 };

    rows.forEach(row => {
      if (row.status === 'Pending') counts.pending = row.count;
      if (row.status === 'Approved') counts.approved = row.count;
      if (row.status === 'Rejected') counts.rejected = row.count;
    });

    res.json(counts);
  });
});




//Authentication
  // Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');
    req.userId = decoded.userId;
    next();
  });
};

  // Protected route (User Dashboard)
app.get('/dashboard', authenticateJWT, (req, res) => {
  res.send(`Welcome user ${req.userId}`);
});

  // Start server
app.listen(PORT, () => {
  console.log('Server running on port 4000');
});
