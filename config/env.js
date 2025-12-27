// Centralized environment variable validation
// Fails fast if any required variable is missing

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
  // PORT is optional - Render provides it automatically
];

const optionalEnvVars = [
  'JWT_EXPIRES_IN',
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM'
];

function validateEnv() {
  // Only load dotenv in non-production (production uses Render's env vars)
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

  const missing = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ FATAL: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Set these in Render dashboard > Environment tab');
    process.exit(1); // Exit immediately - don't start server with missing config
  }

  // Warn about optional vars but don't exit
  const missingOptional = optionalEnvVars.filter(v => !process.env[v]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    missingOptional.forEach(v => console.warn(`   - ${v}`));
  }

  console.log('✅ Environment variables validated');
}

module.exports = {
  validateEnv,
  config: {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRES_IN || '7d',
    nodeEnv: process.env.NODE_ENV || 'development',
    email: {
      service: process.env.EMAIL_SERVICE,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      whatsappFrom: process.env.TWILIO_WHATSAPP_FROM
    }
  }
};
