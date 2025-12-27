const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { startReminderScheduler, sendTestReminder } = require('./services/reminderScheduler');

dotenv.config();

const app = express();

// CORS Configuration - Allow production frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Local development
      'http://localhost:3000',
      'https://myclinic-patient-portal.netlify.app', // Production frontend
      process.env.FRONTEND_URL // Environment variable for flexibility
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded medical reports
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (improved)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Log request body for debugging (except sensitive routes)
  if (!req.url.includes('/auth/login') && !req.url.includes('/auth/signup')) {
    if (Object.keys(req.body).length > 0) {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected Successfully');
    console.log(`✓ Database: ${conn.connection.name}`);
    console.log(`✓ Host: ${conn.connection.host}`);
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    console.error('✗ Full error:', error);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('⚠ MongoDB connection error:', err);
});

connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/second-opinions', require('./routes/secondOpinionRoutes')); // Feature 2: Second Opinion
app.use('/api/payments', require('./routes/paymentRoutes')); // Feature 3: Online Payments
app.use('/api/invoices', require('./routes/invoiceRoutes')); // Feature 3: Invoice Generation

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test reminder endpoint (for testing only)
app.post('/api/test-reminder/:appointmentId', async (req, res) => {
  try {
    const result = await sendTestReminder(req.params.appointmentId);
    res.json({ 
      success: true, 
      message: 'Test reminders sent successfully',
      result 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware (improved)
app.use((err, req, res, next) => {
  console.error('=== ERROR OCCURRED ===');
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('=====================');
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`
  });
});
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    
    // Start appointment reminder scheduler
    startReminderScheduler();
  });
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});