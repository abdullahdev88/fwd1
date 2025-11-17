const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/admin/pending-doctors
// @desc    Get all pending doctors for approval
// @access  Admin only
router.get('/pending-doctors', protect, adminOnly, async (req, res) => {
  try {
    const pendingDoctors = await User.find({
      role: 'doctor',
      status: 'pending'
    }).select('-password');

    res.json({
      success: true,
      data: pendingDoctors
    });
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending doctors'
    });
  }
});

// @route   PUT /api/admin/approve-doctor/:id
// @desc    Approve a doctor
// @access  Admin only
router.put('/approve-doctor/:id', protect, adminOnly, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a doctor'
      });
    }

    doctor.status = 'approved';
    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor approved successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving doctor'
    });
  }
});

// @route   PUT /api/admin/reject-doctor/:id
// @desc    Reject a doctor
// @access  Admin only
router.put('/reject-doctor/:id', protect, adminOnly, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    doctor.status = 'rejected';
    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor rejected successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting doctor'
    });
  }
});

// @route   GET /api/admin/dashboard-stats
// @desc    Get admin dashboard statistics
// @access  Admin only
router.get('/dashboard-stats', protect, adminOnly, async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor', status: 'approved' }),
      User.countDocuments({ role: 'doctor', status: 'pending' }),
      Appointment.countDocuments()
    ]);

    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: stats[0],
        totalPatients: stats[1],
        approvedDoctors: stats[2],
        pendingDoctors: stats[3],
        totalAppointments: stats[4],
        appointmentsByStatus: appointmentStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @route   GET /api/admin/appointment-logs
// @desc    Get all appointment logs with patient and doctor details
// @access  Admin only
router.get('/appointment-logs', protect, adminOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointment logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment logs'
    });
  }
});

// @route   GET /api/admin/all-users
// @desc    Get all users with their details
// @access  Admin only
router.get('/all-users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   DELETE /api/admin/delete-user/:id
// @desc    Delete a user (patient or doctor)
// @access  Admin only
router.delete('/delete-user/:id', protect, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Don't allow admin to delete themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete related appointments if user is a doctor or patient
    if (user.role === 'doctor') {
      await Appointment.deleteMany({ doctor: userId });
    } else if (user.role === 'patient') {
      await Appointment.deleteMany({ patient: userId });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

module.exports = router;
