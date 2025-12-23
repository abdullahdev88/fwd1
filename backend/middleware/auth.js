const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Token:', token || 'No token found');
    console.error('Decoded token attempt failed');
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

const doctorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'doctor' && req.user.status === 'approved') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Approved doctor access required'
    });
  }
};

const patientOnly = (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Patient access required'
    });
  }
};

// Generic authorize middleware - accepts multiple roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  adminOnly,
  doctorOnly,
  patientOnly,
  authorize
};
