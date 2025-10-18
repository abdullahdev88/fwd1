const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS - Allow all origins for development
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 100, // 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use(limiter);

// Set static folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes - API routes must come BEFORE the catch-all route
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// Test database connection route
app.get('/api/test-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ connected: false, message: 'Database not connected' });
    }
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ 
      connected: true, 
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});