const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @route   GET api/users/me
// @desc    Get user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is set in the protect middleware
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
