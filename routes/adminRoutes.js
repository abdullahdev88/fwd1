const express = require('express');
const {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdmin,
  getAdminPrescriptions
} = require('../controllers/admin/adminController');
const {
  getUserProfile,
  updateUserProfile
} = require('../controllers/profile/profileController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorizeRole('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/create-admin', createAdmin);
router.get('/prescriptions', getAdminPrescriptions);

// Profile management routes for admin
router.get('/profile/:id', getUserProfile);
router.put('/profile/:id', updateUserProfile);

module.exports = router;
