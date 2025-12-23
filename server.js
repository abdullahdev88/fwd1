const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Load env variables
dotenv.config();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */

// Body parsers (IMPORTANT for multer + forms)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100
});
app.use(limiter);

// API logging
app.use('/api', (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

/* -------------------- DATABASE -------------------- */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    process.exit(1);
  }
};
connectDB();

/* -------------------- HEALTH ROUTES -------------------- */

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      connected: true,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

/* -------------------- API ROUTES -------------------- */

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

// ✅ MEDICAL REPORT ROUTE (ONLY ONE)
app.use('/api/medical-reports', require('./routes/medicalReportRoutes'));

/* -------------------- 404 HANDLER -------------------- */

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

/* -------------------- FRONTEND HANDLING -------------------- */

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend-react', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(
      path.resolve(__dirname, 'frontend-react', 'dist', 'index.html')
    );
  });
} else {
  app.get('*', (req, res) => {
    res.json({
      message: 'Backend Running',
      frontend: 'Run React separately (npm run dev)',
      api: '/api'
    });
  });
}

/* -------------------- ERROR HANDLER -------------------- */

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 Server running');
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
});
