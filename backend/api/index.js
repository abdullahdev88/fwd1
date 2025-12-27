const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Define base path for requiring modules from parent directory
const basePath = path.join(__dirname, '..');

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
app.use('/uploads', express.static(path.join(basePath, 'uploads')));

// Request logging middleware (improved)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection (Singleton pattern for serverless)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✓ Using existing database connection');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log('✓ MongoDB Connected Successfully');
    console.log(`✓ Database: ${db.connections[0].name}`);
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    throw error;
  }
};

// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('✗ MongoDB Connection Failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Root route (BEFORE other routes to avoid conflicts)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      appointments: '/api/appointments/*',
      doctors: '/api/doctor/*',
      patients: '/api/patient/*'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'Connected' : 'Disconnected'
  });
});

// API Routes
try {
  app.use('/api/auth', require(path.join(basePath, 'routes', 'authRoutes')));
  app.use('/api/profile', require(path.join(basePath, 'routes', 'profileRoutes')));
  app.use('/api/appointments', require(path.join(basePath, 'routes', 'appointmentRoutes')));
  app.use('/api/medical-records', require(path.join(basePath, 'routes', 'medicalRecordRoutes')));
  app.use('/api/prescriptions', require(path.join(basePath, 'routes', 'prescriptionRoutes')));
  app.use('/api/admin', require(path.join(basePath, 'routes', 'adminRoutes')));
  app.use('/api/doctor', require(path.join(basePath, 'routes', 'doctorRoutes')));
  app.use('/api/patient', require(path.join(basePath, 'routes', 'patientRoutes')));
  app.use('/api/second-opinions', require(path.join(basePath, 'routes', 'secondOpinionRoutes')));
  app.use('/api/payments', require(path.join(basePath, 'routes', 'paymentRoutes')));
  app.use('/api/invoices', require(path.join(basePath, 'routes', 'invoiceRoutes')));
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// Test reminder endpoint
app.post('/api/test-reminder/:appointmentId', async (req, res) => {
  try {
    const { sendTestReminder } = require(path.join(basePath, 'services', 'reminderScheduler'));
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler (MUST be last)
app.use((req, res) => {
  console.log('⚠️ 404 Not Found:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Export the Express app (NO app.listen())
module.exports = app;
