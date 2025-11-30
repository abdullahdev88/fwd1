const User = require('../../models/User');

// @desc    Get current user profile
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update current user profile
// @route   PUT /api/profile/update
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Define allowed fields for each role
    const commonFields = ['name', 'phone', 'gender', 'address', 'dateOfBirth'];
    const doctorFields = ['specialization', 'experience', 'consultationFee', 'qualification', 'availability'];
    const patientFields = ['bloodGroup', 'emergencyContact'];

    let allowedFields = [...commonFields];
    
    if (user.role === 'doctor') {
      allowedFields = [...allowedFields, ...doctorFields];
    } else if (user.role === 'patient') {
      allowedFields = [...allowedFields, ...patientFields];
    }

    // Filter only allowed fields from request body
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    // Email update requires special validation
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: user._id } 
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
      updateData.email = req.body.email;
    }

    // Update user with only allowed fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.getPublicProfile()
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get any user profile (Admin only)
// @route   GET /api/admin/profile/:id
// @access  Admin only
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update any user profile (Admin only)
// @route   PUT /api/admin/profile/:id
// @access  Admin only
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin can update any field except password and role
    const restrictedFields = ['password', '_id', '__v'];
    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (!restrictedFields.includes(key) && req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    // Email validation for admin updates
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: user._id } 
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.getPublicProfile()
    });

  } catch (error) {
    console.error('Update User Profile Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/upload-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    // For now, we'll just store the filename/path
    // In production, you'd want to use multer or similar for file uploads
    const { profilePicture } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: updatedUser.getPublicProfile()
    });

  } catch (error) {
    console.error('Upload Profile Picture Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture
};