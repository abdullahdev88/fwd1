const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

console.log('Starting debug script...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Try to connect to MongoDB
console.log('Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connection successful');
    // Close the connection after success
    mongoose.connection.close();
    console.log('Connection closed');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    if (err.name === 'MongoParseError') {
      console.error('This is likely due to an invalid connection string format');
    }
    if (err.name === 'MongoServerSelectionError') {
      console.error('This could be due to network issues or MongoDB Atlas IP whitelist restrictions');
    }
    process.exit(1);
  });
