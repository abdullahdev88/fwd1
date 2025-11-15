const express = require('express');
const {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdmin
} = require('../controllers/auth/adminController');
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

module.exports = router;
