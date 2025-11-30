const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture
} = require('../controllers/profile/profileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Profile management routes
router.route('/me')
  .get(getMyProfile);

router.route('/update')
  .put(updateMyProfile);

router.route('/upload-picture')
  .post(uploadProfilePicture);

module.exports = router;