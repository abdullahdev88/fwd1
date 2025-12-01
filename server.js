const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Load env vars FIRST
dotenv.config();

const app = express();

// Body parser FIRST
app.use(express.json());

// Enable CORS BEFORE routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use(limiter);

// API Request logging - ONLY for /api routes
app.use('/api', (req, res, next) => {
  console.log(`${new Date().toISOString()} - API ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// API Routes FIRST - Very important order
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

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

// Auth and User routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// Mount backend routes (when frontend is calling top-level API URL)
// These route files live in the `backend/routes` folder and contain
// the medical-records, doctor, patient, admin and profile handlers.
app.use('/api/medical-records', require('./backend/routes/medicalRecordRoutes'));
app.use('/api/profile', require('./backend/routes/profileRoutes'));
app.use('/api/appointments', require('./backend/routes/appointmentRoutes'));
app.use('/api/doctor', require('./backend/routes/doctorRoutes'));
app.use('/api/patient', require('./backend/routes/patientRoutes'));
app.use('/api/admin', require('./backend/routes/adminRoutes'));

// Handle 404 for API routes specifically
app.use('/api/*', (req, res) => {
  console.log('❌ API route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

// Serve React build files (when built) or redirect to dev server
if (process.env.NODE_ENV === 'production') {
  // Serve React build files in production
  app.use(express.static(path.join(__dirname, 'frontend-react', 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend-react', 'dist', 'index.html'));
  });
} else {
  // In development, just serve a message redirecting to React dev server
  app.get('*', (req, res) => {
    res.json({
      message: 'Development Mode',
      note: 'Please run the React frontend separately on port 3000 or 5173',
      react_dev_server: 'npm run dev (in frontend-react directory)',
      api_endpoints: {
        health: `http://localhost:${process.env.PORT || 5000}/api/health`,
        test_db: `http://localhost:${process.env.PORT || 5000}/api/test-db`
      }
    });
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('🚀 Server starting...');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Development Mode: Run React frontend separately');
    console.log('📱 React Frontend: cd frontend-react && npm run dev');
  }
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});