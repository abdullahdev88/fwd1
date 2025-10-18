const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Using Database: ${conn.connection.db.databaseName}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('Troubleshooting tips:');
    console.error('1. Check your MongoDB connection string in .env');
    console.error('2. Ensure your IP is whitelisted in MongoDB Atlas');
    console.error('3. Verify database user credentials');
    process.exit(1);
  }
};

module.exports = connectDB;
