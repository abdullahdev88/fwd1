const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hardcoded Admin Credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@hospital.com',
  password: 'admin123456',
  name: 'System Admin',
  role: 'admin'
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key-here', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/signup
// @desc    Register a new user (Patient or Doctor)
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    console.log('📨 Full Request Body:', JSON.stringify(req.body, null, 2));
    
    const { name, email, password, phone, role, specialization, experience, education, pmdcId } = req.body;
    
    console.log('🔍 Extracted pmdcId:', pmdcId);
    console.log('🔍 Role:', role);

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate doctor-specific fields
    if (role === 'doctor') {
      if (!specialization || !experience || !education || !pmdcId) {
        return res.status(400).json({
          success: false,
          message: 'Please provide specialization, experience, education, and PMDC ID for doctor registration'
        });
      }
    }

    // Create user data object
    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'patient'
    };

    // Add doctor-specific fields if role is doctor
    if (role === 'doctor') {
      userData.specialization = specialization;
      userData.experience = parseInt(experience);
      userData.education = education;
      userData.pmdcId = pmdcId;
      userData.status = 'pending'; // Set to pending for approval
    }

    // Create new user
    const user = await User.create(userData);

    // Different response for doctors
    if (role === 'doctor') {
      return res.status(201).json({
        success: true,
        message: 'Your request has been sent to the admin for approval.',
        requiresApproval: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for hardcoded admin credentials
    if (email.toLowerCase() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      // Create or get admin user
      let adminUser = await User.findOne({ email: ADMIN_CREDENTIALS.email });
      
      if (!adminUser) {
        adminUser = await User.create({
          name: ADMIN_CREDENTIALS.name,
          email: ADMIN_CREDENTIALS.email,
          password: ADMIN_CREDENTIALS.password,
          phone: '0000000000',
          role: 'admin'
        });
      }

      const token = generateToken(adminUser._id);

      return res.status(200).json({
        success: true,
        message: 'Admin logged in successfully',
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'admin'
        }
      });
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check doctor approval status
    if (user.role === 'doctor' && user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.'
      });
    }

    if (user.role === 'doctor' && user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been rejected. Please contact admin.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('User logged in successfully:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
});

module.exports = router;
