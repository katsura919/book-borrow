
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

// Create users table
db.serialize(() => {
   // Create users table
   db.run('CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, firstName TEXT NOT NULL,lastName TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL);');
    
   // Create students table
   db.run('CREATE TABLE IF NOT EXISTS students (student_id VARCHAR(20) PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email VARCHAR(100) NOT NULL, contact_number VARCHAR(100) NOT NULL);');

   // Create book borrow table
   db.run(`CREATE TABLE IF NOT EXISTS book_reqsts  (
     req_id INTEGER PRIMARY KEY AUTOINCREMENT,
     student_id VARCHAR(20) NOT NULL,
     borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
     status TEXT DEFAULT 'pending',
     return_date DATETIME DEFAULT NULL,
     req_created DATETIME DEFAULT CURRENT_TIMESTAMP,
     req_approve DATETIME DEFAULT NULL,
     FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
     );`);
   
   db.run('CREATE TABLE IF NOT EXISTS borrowed_books (book_id INTEGER PRIMARY KEY AUTOINCREMENT, borrow_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, isbn VARCHAR(20) NOT NULL, FOREIGN KEY (borrow_id) REFERENCES book_reqsts(req_id) ON DELETE CASCADE);');
});

// User Registration
app.post('/register', (req, res) => {
  const { firstName, lastName, username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing username or password');
  
  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insert user into database
  db.run('INSERT INTO users (firstName, lastName, username, password) VALUES (?, ?, ?, ?)', [firstName, lastName, username, hashedPassword], function (err) {
    if (err) return res.status(500).send('Error registering user');
    res.status(201).send('User registered');
  });
});

// User Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing username or password');

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(402).send('Invalid Username');

    // Check password
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) return res.status(401).send('Invalid Password');

    // Create a JWT token
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
  });
});



// Book Request
app.post('/borrow', (req, res) => {
  const { studentId, firstName, lastName, email, contactNumber, books } = req.body;

  // Validate required fields
  if (!studentId || !firstName || !lastName || !email || !contactNumber || !books.length) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Step 1: Insert or Update Student Info in `students` Table
  db.run(
    `INSERT INTO students (student_id, first_name, last_name, email, contact_number) 
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(student_id) DO UPDATE SET 
     first_name = excluded.first_name, 
     last_name = excluded.last_name, 
     email = excluded.email, 
     contact_number = excluded.contact_number`,
    [studentId, firstName, lastName, email, contactNumber],
    function (err) {
      if (err) {
        console.error('Error inserting/updating student:', err.message);
        return res.status(500).json({ message: 'Error saving student info' });
      }

      // Step 2: Insert Borrow Request in `book_reqsts` Table
      db.run(
        'INSERT INTO book_reqsts (student_id) VALUES (?)',
        [studentId],
        function (err) {
          if (err) {
            console.error('Error creating borrow request:', err.message);
            return res.status(500).json({ message: 'Error creating borrow request' });
          }

          const borrowId = this.lastID;

          // Step 3: Bulk Insert Books into `borrowed_books` Table
          const insertBooks = books.map((book) => {
            return new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO borrowed_books (borrow_id, title, isbn) VALUES (?, ?, ?)',
                [borrowId, book.title, book.isbn],
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
        }
      );
    }
  );
});

// Show all book requests
app.get('/book-requests', (req, res) => {
  db.all("SELECT * FROM book_reqsts WHERE status = 'pending'", [], (err, rows) => {
    if (err) {
      console.error('Error fetching book requests:', err.message);
      return res.status(500).json({ message: 'Error fetching book requests' });
    }
    res.json(rows);
  });
});


// Show all approved requests
app.get('/approved-req', (req, res) => {
  db.all("SELECT * FROM book_reqsts WHERE status = 'approved'", [], (err, rows) => {
    if (err) {
      console.error('Error fetching book requests:', err.message);
      return res.status(500).json({ message: 'Error fetching book requests' });
    }
    res.json(rows);
  });
});

//Show all declined requests
app.get('/declined-req', (req, res) => {
  db.all("SELECT * FROM book_reqsts WHERE status = 'declined'", [], (err, rows) => {
    if (err) {
      console.error('Error fetching book requests:', err.message);
      return res.status(500).json({ message: 'Error fetching book requests' });
    }
    res.json(rows);
  });
});


// Approve a request
app.post('/approve-request', (req, res) => {
  const { reqId } = req.body;

  // Update the status of the request in the database
  db.run('UPDATE book_reqsts SET status = ? WHERE req_id = ?', ['approved', reqId], function(err) {
    if (err) {
      console.error('Error updating book request status:', err.message);
      return res.status(500).json({ message: 'Error updating book request status' });
    }

    // Respond with success
    res.status(200).json({ message: 'Book request approved successfully' });
  });
});

// Decline a request
app.post('/decline-request', (req, res) => {
  const { reqId } = req.body;

  // Update the status of the request in the database
  db.run('UPDATE book_reqsts SET status = ? WHERE req_id = ?', ['declined', reqId], function(err) {
    if (err) {
      console.error('Error updating book request status:', err.message);
      return res.status(500).json({ message: 'Error updating book request status' });
    }

    // Respond with success
    res.status(200).json({ message: 'Book request approved successfully' });
  });
});

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
