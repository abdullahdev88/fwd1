const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// CRITICAL: Validate environment variables BEFORE anything else
const { validateEnv, config } = require('./config/env');
validateEnv(); // Exits if required vars missing

const connectDB = require('./config/db');

const app = express();

/* -------------------- MIDDLEWARE -------------------- */

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (local + deployed frontend)
const allowedOrigins = config.nodeEnv === 'production'
  ? [process.env.FRONTEND_URL || 'https://your-frontend.vercel.app']
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
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

// Connect to database - exits if connection fails
connectDB();

/* -------------------- HEALTH ROUTES -------------------- */

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: config.nodeEnv,
    time: new Date().toISOString()
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      connected: true,
      database: mongoose.connection.name,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

/* -------------------- API ROUTES -------------------- */

app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/users', require('./routes/users'));

app.use('/api/patient', require('./backend/routes/patientRoutes'));
app.use('/api/doctor', require('./backend/routes/doctorRoutes'));
app.use('/api/admin', require('./backend/routes/adminRoutes'));
app.use('/api/appointments', require('./backend/routes/appointmentRoutes'));
app.use('/api/profile', require('./backend/routes/profileRoutes'));

// Medical reports
app.use('/api/medical-reports', require('./routes/medicalReportRoutes'));

/* -------------------- 404 HANDLER -------------------- */

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

/* -------------------- FRONTEND HANDLING -------------------- */

if (config.nodeEnv === 'production') {
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

// Only start server if we got this far (env vars + DB validated)
app.listen(config.port, () => {
  console.log('🚀 Server running');
  console.log(`📡 Port: ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`💚 Health check: /api/health`);
});
