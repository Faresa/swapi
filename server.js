const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = '999999';

// Create and connect to the SQLite database
const db = new sqlite3.Database('database.db');

// Create users table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// Create cache table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS cache (
    id INTEGER PRIMARY KEY,
    search_query TEXT UNIQUE,
    results TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.userId = decoded.id;
    next();
  });
}

// Signup endpoint
app.post('/signup', (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    db.run(
      'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hash],
      (err) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(400).json({ error: 'Error creating user' });
        }
        res.status(201).json({ message: 'User created successfully' });
      }
    );
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!result) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: row.id }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    });
  });
});

// Search endpoint with caching
app.get('/search', verifyToken, (req, res) => {
  const { query } = req.query; // Extract search query from request

  // Check if result is cached and still valid
  db.get('SELECT * FROM cache WHERE search_query = ?', [query], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (row) {
      // Return cached result if still valid
      const currentTime = new Date().getTime();
      const lastUpdated = new Date(row.last_updated).getTime();
      const cachingTime = 15 * 60 * 1000; // 15 minutes in milliseconds

      if (currentTime - lastUpdated <= cachingTime) {
        return res.json(JSON.parse(row.results));
      }
    }

    // Fetch fresh data from Star Wars API
    axios.get(`https://swapi.dev/api/people/?search=${query}`)
      .then(response => {
        const results = response.data.results;
        if (results.length === 0) {
          return res.status(404).json({ error: 'No results found' });
        }

        // Update the cache with the new result
        db.run(
          'INSERT OR REPLACE INTO cache (search_query, results) VALUES (?, ?)',
          [query, JSON.stringify(results)],
          (err) => {
            if (err) {
              console.error('Error updating cache:', err);
            }
          }
        );

        res.json(results);
      })
      .catch(error => {
        console.error('Error fetching data from Star Wars API:', error);
        res.status(500).json({ error: 'Error fetching data from Star Wars API' });
      });
  });
});

// Check if there is cached data for a search query
app.get('/check-cache', (req, res) => {
  const searchQuery = req.query.query; // Extract search query from request
  if (!searchQuery) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  db.get('SELECT * FROM cache WHERE search_query = ?', [searchQuery], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (row) {
      const currentTime = new Date().getTime();
      const lastUpdated = new Date(row.last_updated).getTime();
      const cachingTime = 15 * 60 * 1000; // 15 minutes in milliseconds
      if (currentTime - lastUpdated <= cachingTime) {
        return res.json({ cached: true });
      } else {
        return res.json({ cached: false });
      }
    } else {
      return res.json({ cached: false });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
