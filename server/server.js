
// imports
import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cron from 'node-cron';

const app = express();
const PORT = 4000;

app.use(cors({
    origin: 'http://localhost:5173' // Your React app URL
  }));
app.use(bodyParser.json());

const SECRET_KEY = 'aassaassaassaassaassaassaassaassaassaass';

// Connect to SQLite database
const db = new sqlite3.Database('LMS.db'); // Or use a file for persistence: './database.sqlite'


// Create tables
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
    CREATE TABLE IF NOT EXISTS book_req(
      req_id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower_id VARCHAR(20) NOT NULL,
      status TEXT DEFAULT 'Pending',
      req_created DATE DEFAULT CURRENT_DATE,
      req_approve DATE DEFAULT NULL,
      overdue_days INTEGER DEFAULT 0,
      FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id) ON DELETE CASCADE
    );
  `);

  // Create Borrowed Books Table
  db.run(`
    CREATE TABLE IF NOT EXISTS borrowed_books (
      borrow_id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      due_date DATE,
      FOREIGN KEY (req_id) REFERENCES book_req(req_id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES available_books(book_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS available_books (
      book_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      isbn VARCHAR(20) NOT NULL UNIQUE,
      author VARCHAR(100) NOT NULL,
      total_copies INTEGER NOT NULL,
      available_copies INTEGER NOT NULL
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


  //Fetch Available Books
app.get('/available-books', (req, res) => {
    const query = `
      SELECT 
        book_id, title, isbn, author, available_copies 
      FROM 
        available_books 
      WHERE 
        available_copies > 0
    `;
  
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching available books:', err.message);
        res.status(500).json({ message: 'Failed to retrieve books' });
      } else {
        res.status(200).json(rows);
      }
    });
  });


  // Request a book
  app.post('/borrow-book', (req, res) => {
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
      student: { maxBooks: 3, dueDays: 7 },
      faculty: { maxBooks: 10, dueDays: 120 }, // 1 semester (~120 days)
      employee: { maxBooks: 10, dueDays: 7 },
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
  
        // Step 2: Insert Borrow Request in `book_req` Table
        db.run('INSERT INTO book_req (borrower_id) VALUES (?)', [studentId], function (err) {
          if (err) {
            console.error('Error creating borrow request:', err.message);
            return res.status(500).json({ message: 'Error creating borrow request' });
          }
  
          const borrowRequestId = this.lastID;
  
          // Step 3: Bulk Insert Books into `borrowed_books` Table
          const insertBooks = books.map((book) => {
            return new Promise((resolve, reject) => {
              console.log('Inserting book:', book.value); // Ensure this logs the correct book ID
              db.run(
                'INSERT INTO borrowed_books (req_id, book_id, due_date) VALUES (?, ?, ?)',
                [borrowRequestId, book.value, null],  // Use book.value instead of book.book_id
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
  //Overview Page
app.get('/request-counts', (req, res) => {
  db.all('SELECT status, COUNT(*) AS count FROM book_req GROUP BY status', [], (err, rows) => {
    if (err) {
      console.error('Error fetching request counts:', err.message);
      return res.status(500).json({ message: 'Error fetching request counts' });
    }

    const counts = { pending: 0, approved: 0, rejected: 0, overdue: 0 };

    rows.forEach(row => {
      if (row.status === 'Pending') counts.pending = row.count;
      if (row.status === 'Approved') counts.approved = row.count;
      if (row.status === 'Rejected') counts.rejected = row.count;
      if (row.status === 'Overdue') counts.overdue = row.count;
    });

    res.json(counts);
  });
});





// Show Requests
  // Show all requests
app.get('/all-req', (req, res) => {
    const sql = `
      SELECT 
        br.req_id,
        br.borrower_id,
        br.status,
        br.req_created,
        br.req_approve,
        b.first_name,
        b.last_name,
        b.borrower_type,
        bb.borrow_id,
        bb.book_id,
        ab.title,
        ab.isbn,
        bb.due_date
      FROM 
        book_req AS br
      JOIN 
        borrowers AS b ON br.borrower_id = b.borrower_id
      LEFT JOIN 
        borrowed_books AS bb ON br.req_id = bb.req_id
      LEFT JOIN 
        available_books AS ab ON bb.book_id = ab.book_id
      ORDER BY 
        br.req_id;
    `;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching book requests:', err.message);
        return res.status(500).json({ message: 'Error fetching book requests.' });
      }
  
      // Format the result to group borrowed books under their respective requests
      const formattedResponse = rows.reduce((acc, row) => {
        const {
          req_id,
          borrower_id,
          status,
          req_created,
          req_approve,
          first_name,
          last_name,
          borrower_type,
          borrow_id,
          book_id,
          title,
          isbn,
          due_date,
        } = row;
  
        // Check if the request already exists in the accumulator
        let request = acc.find((r) => r.req_id === req_id);
        if (!request) {
          request = {
            req_id,
            borrower_id,
            status,
            req_created,
            req_approve,
            borrower: {
              first_name,
              last_name,
              borrower_type,
            },
            books: [],
          };
          acc.push(request);
        }
  
        // If there's a book, add it to the request
        if (book_id) {
          request.books.push({
            borrow_id,
            book_id,
            title,
            isbn,
            due_date,
          });
        }
  
        return acc;
      }, []);
  
      res.status(200).json(formattedResponse);
    });
  });
  
  // Show pending requests
app.get('/pending-req', (req, res) => {
    const sql = `
      SELECT 
        br.req_id,
        br.borrower_id,
        br.status,
        br.req_created,
        br.req_approve,
        b.first_name,
        b.last_name,
        b.borrower_type,
        bb.borrow_id,
        bb.book_id,
        ab.title,
        ab.isbn,
        bb.due_date
      FROM 
        book_req AS br
      JOIN 
        borrowers AS b ON br.borrower_id = b.borrower_id
      LEFT JOIN 
        borrowed_books AS bb ON br.req_id = bb.req_id
      LEFT JOIN 
        available_books AS ab ON bb.book_id = ab.book_id
      WHERE 
        br.status = 'Pending'
      ORDER BY 
        br.req_id;
    `;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching book requests:', err.message);
        return res.status(500).json({ message: 'Error fetching book requests.' });
      }
  
      // Format the result to group borrowed books under their respective requests
      const formattedResponse = rows.reduce((acc, row) => {
        const {
          req_id,
          borrower_id,
          status,
          req_created,
          req_approve,
          first_name,
          last_name,
          borrower_type,
          borrow_id,
          book_id,
          title,
          isbn,
          due_date,
        } = row;
  
        // Check if the request already exists in the accumulator
        let request = acc.find((r) => r.req_id === req_id);
        if (!request) {
          request = {
            req_id,
            borrower_id,
            status,
            req_created,
            req_approve,
            borrower: {
              first_name,
              last_name,
              borrower_type,
            },
            books: [],
          };
          acc.push(request);
        }
  
        // If there's a book, add it to the request
        if (book_id) {
          request.books.push({
            borrow_id,
            book_id,
            title,
            isbn,
            due_date,
          });
        }
  
        return acc;
      }, []);
  
      res.status(200).json(formattedResponse);
    });
});

  // Show approved requests
app.get('/approved-req', (req, res) => {
    const sql = `
      SELECT 
        br.req_id,
        br.borrower_id,
        br.status,
        br.req_created,
        br.req_approve,
        b.first_name,
        b.last_name,
        b.borrower_type,
        bb.borrow_id,
        bb.book_id,
        ab.title,
        ab.isbn,
        bb.due_date
      FROM 
        book_req AS br
      JOIN 
        borrowers AS b ON br.borrower_id = b.borrower_id
      LEFT JOIN 
        borrowed_books AS bb ON br.req_id = bb.req_id
      LEFT JOIN 
        available_books AS ab ON bb.book_id = ab.book_id
      WHERE 
        br.status = 'Approved'
      ORDER BY 
        br.req_id;
    `;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching book requests:', err.message);
        return res.status(500).json({ message: 'Error fetching book requests.' });
      }
  
      // Format the result to group borrowed books under their respective requests
      const formattedResponse = rows.reduce((acc, row) => {
        const {
          req_id,
          borrower_id,
          status,
          req_created,
          req_approve,
          first_name,
          last_name,
          borrower_type,
          borrow_id,
          book_id,
          title,
          isbn,
          due_date,
        } = row;
  
        // Check if the request already exists in the accumulator
        let request = acc.find((r) => r.req_id === req_id);
        if (!request) {
          request = {
            req_id,
            borrower_id,
            status,
            req_created,
            req_approve,
            borrower: {
              first_name,
              last_name,
              borrower_type,
            },
            books: [],
          };
          acc.push(request);
        }
  
        // If there's a book, add it to the request
        if (book_id) {
          request.books.push({
            borrow_id,
            book_id,
            title,
            isbn,
            due_date,
          });
        }
  
        return acc;
      }, []);
  
      res.status(200).json(formattedResponse);
    });
});

  // Show rejected requests
app.get('/rejected-req', (req, res) => {
    const sql = `
      SELECT 
        br.req_id,
        br.borrower_id,
        br.status,
        br.req_created,
        br.req_approve,
        b.first_name,
        b.last_name,
        b.borrower_type,
        bb.borrow_id,
        bb.book_id,
        ab.title,
        ab.isbn,
        bb.due_date
      FROM 
        book_req AS br
      JOIN 
        borrowers AS b ON br.borrower_id = b.borrower_id
      LEFT JOIN 
        borrowed_books AS bb ON br.req_id = bb.req_id
      LEFT JOIN 
        available_books AS ab ON bb.book_id = ab.book_id
      WHERE 
        br.status = 'Rejected'
      ORDER BY 
        br.req_id;
    `;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching book requests:', err.message);
        return res.status(500).json({ message: 'Error fetching book requests.' });
      }
  
      // Format the result to group borrowed books under their respective requests
      const formattedResponse = rows.reduce((acc, row) => {
        const {
          req_id,
          borrower_id,
          status,
          req_created,
          req_approve,
          first_name,
          last_name,
          borrower_type,
          borrow_id,
          book_id,
          title,
          isbn,
          due_date,
        } = row;
  
        // Check if the request already exists in the accumulator
        let request = acc.find((r) => r.req_id === req_id);
        if (!request) {
          request = {
            req_id,
            borrower_id,
            status,
            req_created,
            req_approve,
            borrower: {
              first_name,
              last_name,
              borrower_type,
            },
            books: [],
          };
          acc.push(request);
        }
  
        // If there's a book, add it to the request
        if (book_id) {
          request.books.push({
            borrow_id,
            book_id,
            title,
            isbn,
            due_date,
          });
        }
  
        return acc;
      }, []);
  
      res.status(200).json(formattedResponse);
    });
});

  // Show overdue requests
app.get('/overdue-req', (req, res) => {
    const sql = `
      SELECT 
        br.req_id,
        br.borrower_id,
        br.status,
        br.req_created,
        br.req_approve,
        b.first_name,
        b.last_name,
        b.borrower_type,
        bb.borrow_id,
        bb.book_id,
        ab.title,
        ab.isbn,
        bb.due_date
      FROM 
        book_req AS br
      JOIN 
        borrowers AS b ON br.borrower_id = b.borrower_id
      LEFT JOIN 
        borrowed_books AS bb ON br.req_id = bb.req_id
      LEFT JOIN 
        available_books AS ab ON bb.book_id = ab.book_id
      WHERE 
        br.status = 'Overdue'
      ORDER BY 
        br.req_id;
    `;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching book requests:', err.message);
        return res.status(500).json({ message: 'Error fetching book requests.' });
      }
  
      // Format the result to group borrowed books under their respective requests
      const formattedResponse = rows.reduce((acc, row) => {
        const {
          req_id,
          borrower_id,
          status,
          req_created,
          req_approve,
          first_name,
          last_name,
          borrower_type,
          borrow_id,
          book_id,
          title,
          isbn,
          due_date,
        } = row;
  
        // Check if the request already exists in the accumulator
        let request = acc.find((r) => r.req_id === req_id);
        if (!request) {
          request = {
            req_id,
            borrower_id,
            status,
            req_created,
            req_approve,
            borrower: {
              first_name,
              last_name,
              borrower_type,
            },
            books: [],
          };
          acc.push(request);
        }
  
        // If there's a book, add it to the request
        if (book_id) {
          request.books.push({
            borrow_id,
            book_id,
            title,
            isbn,
            due_date,
          });
        }
  
        return acc;
      }, []);
  
      res.status(200).json(formattedResponse);
    });
});





// Buttons 
  // Approve a request
  app.post('/approve-request', (req, res) => {
    const { reqId } = req.body;

    // Validate reqId
    if (!reqId) {
        return res.status(400).json({ message: 'Request ID is required.' });
    }

    // Query to get the borrower type and associated book IDs based on the request ID
    const getBorrowerDetailsQuery = `
      SELECT borrowers.borrower_type, book_req.borrower_id, bb.book_id
      FROM book_req
      JOIN borrowers ON book_req.borrower_id = borrowers.borrower_id
      JOIN borrowed_books AS bb ON book_req.req_id = bb.req_id
      WHERE book_req.req_id = ?
    `;

    // Define due days per borrower type
    const rules = {
        student: 7,   // 7 days
        faculty: 120, // 1 semester (~120 days)
        employee: 7,  // 7 days
    };

    db.all(getBorrowerDetailsQuery, [reqId], (err, rows) => {
        if (err) {
            console.error('Error fetching borrower details:', err.message);
            return res.status(500).json({ message: 'Error fetching borrower details' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request or borrower not found.' });
        }

        const borrowerType = rows[0].borrower_type;
        const borrowerId = rows[0].borrower_id;

        const dueDays = rules[borrowerType];

        // Calculate the due date based on the current date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);
        const formattedDueDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Step 1: Update the request status and approval date
        db.run(
            'UPDATE book_req SET status = ?, req_approve = CURRENT_DATE WHERE req_id = ?',
            ['Approved', reqId],
            function (err) {
                if (err) {
                    console.error('Error updating book request status:', err.message);
                    return res.status(500).json({ message: 'Error updating book request status' });
                }

                // Step 2: Update the due date for all books associated with the request
                db.run(
                    'UPDATE borrowed_books SET due_date = ? WHERE req_id = ?',
                    [formattedDueDate, reqId],
                    function (err) {
                        if (err) {
                            console.error('Error updating due date for books:', err.message);
                            return res.status(500).json({ message: 'Error updating due date for books' });
                        }

                        // Step 3: Decrease the number of available books
                        const updateAvailableBooksPromises = rows.map(row => {
                            return new Promise((resolve, reject) => {
                                db.run(
                                    'UPDATE available_books SET available_copies = available_copies - 1 WHERE book_id = ? AND available_copies > 0',
                                    [row.book_id],
                                    function (err) {
                                        if (err) {
                                            console.error('Error updating available books:', err.message);
                                            return reject(err);
                                        }
                                        resolve();
                                    }
                                );
                            });
                        });

                        Promise.all(updateAvailableBooksPromises)
                            .then(() => {
                                // Respond with success and the updated due date
                                res.status(200).json({
                                    message: 'Book request approved successfully',
                                    dueDate: formattedDueDate,
                                    borrowerType: borrowerType,
                                    borrowerId: borrowerId,
                                });
                            })
                            .catch(err => {
                                console.error('Error updating available books:', err.message);
                                res.status(500).json({ message: 'Error updating available books' });
                            });
                    }
                );
            }
        );
    });
});

  

  // Reject a request
  app.post('/reject-request', (req, res) => {
    const { reqId } = req.body;
  
    // Validate reqId
    if (!reqId) {
      return res.status(400).json({ message: 'Request ID is required.' });
    }
  
    // Query to get the borrower type and associated book IDs based on the request ID
    const getBorrowerDetailsQuery = `
      SELECT borrowers.borrower_type, book_req.borrower_id
      FROM book_req
      JOIN borrowers ON book_req.borrower_id = borrowers.borrower_id
      WHERE book_req.req_id = ?
    `;
  
    // Define due days per borrower type
    const rules = {
      student: 7,   // 7 days
      faculty: 120, // 1 semester (~120 days)
      employee: 7,  // 7 days
    };
  
    db.get(getBorrowerDetailsQuery, [reqId], (err, row) => {
      if (err) {
        console.error('Error fetching borrower details:', err.message);
        return res.status(500).json({ message: 'Error fetching borrower details' });
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
        'UPDATE book_req SET status = ?, req_approve = CURRENT_DATE WHERE req_id = ?',
        ['Rejected', reqId],
        function (err) {
          if (err) {
            console.error('Error updating book request status:', err.message);
            return res.status(500).json({ message: 'Error updating book request status' });
          }
  
          // Step 2: Update the due date for all books associated with the request
          db.run(
            'UPDATE borrowed_books SET due_date = ? WHERE req_id = ?',
            [formattedDueDate, reqId],
            function (err) {
              if (err) {
                console.error('Error updating due date for books:', err.message);
                return res.status(500).json({ message: 'Error updating due date for books' });
              }
  
              // Respond with success and the updated due date
              res.status(200).json({
                message: 'Book request approved successfully',
                dueDate: formattedDueDate,
                borrowerType: row.borrower_type,
                borrowerId: row.borrower_id,
              });
            }
          );
        }
      );
    });
  });



// Function to update approved status to overdue
const updateOverdueStatuses = () => {
  const updateQuery = `
  UPDATE book_req
  SET status = 'Overdue'
  FROM borrowed_books bb
  WHERE book_req.req_id = bb.req_id 
    AND bb.due_date < DATE('now') 
    AND book_req.status != 'Overdue';
`;


  db.run(updateQuery, function (err) {
    if (err) {
      console.error('Error updating overdue requests:', err.message);
    } else {
      console.log(`Overdue statuses updated successfully. Changes made: ${this.changes}`);
    }
  });
};

// Schedule updateOverdueStatuses to run every hour
cron.schedule('0 * * * *', updateOverdueStatuses);




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
