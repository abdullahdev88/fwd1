const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { startReminderScheduler, sendTestReminder } = require('./services/reminderScheduler');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded medical reports
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
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