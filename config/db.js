const mongoose = require('mongoose');
const { config } = require('./env');

// Robust MongoDB connection with validation
const connectDB = async () => {
  // Fail fast if MONGODB_URI is undefined
  if (!config.mongoUri) {
    console.error('❌ FATAL: MONGODB_URI is undefined');
    console.error('💡 This variable must be set in Render Environment tab');
    process.exit(1);
  }

  try {
    // Mongoose 8+ doesn't need deprecated options
    const conn = await mongoose.connect(config.mongoUri);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Check your MONGODB_URI and network settings');
    process.exit(1); // Don't continue without database
  }
};

module.exports = connectDB;
