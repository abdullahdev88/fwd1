const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect, doctorOnly } = require('../middleware/auth');
const { getDoctorPrescriptions } = require('../controllers/doctor/doctorController');

// @route   GET /api/doctor/dashboard
// @desc    Get doctor dashboard data
// @access  Doctor only
router.get('/dashboard', protect, doctorOnly, async (req, res) => {
  try {
    // Get doctor's appointments
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: -1 })
      .limit(10);

    // Count statistics
    const totalAppointments = await Appointment.countDocuments({ doctor: req.user.id });
    const todayAppointments = await Appointment.countDocuments({
      doctor: req.user.id,
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    const upcomingAppointments = await Appointment.countDocuments({
      doctor: req.user.id,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });

    res.json({
      success: true,
      data: {
        appointments,
        stats: {
          total: totalAppointments,
          today: todayAppointments,
          upcoming: upcomingAppointments
        },
        doctor: {
          name: req.user.name,
          email: req.user.email,
          specialization: req.user.specialization,
          experience: req.user.experience
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @route   POST /api/doctor/availability
// @desc    Add availability slots
// @access  Doctor only
router.post('/availability', protect, doctorOnly, async (req, res) => {
  try {
    const { date, timeSlots } = req.body;
    const doctorId = req.user.id;

    console.log('📅 Updating availability:', { doctorId, date, timeSlots });

    // Validation
    if (!date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Date and at least one time slot are required'
      });
    }

    const doctor = await User.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if date already exists
    const existingDateIndex = doctor.availability.findIndex(
      avail => avail.date.toDateString() === new Date(date).toDateString()
    );

    if (existingDateIndex !== -1) {
      // Update existing date
      doctor.availability[existingDateIndex].timeSlots = timeSlots;
      console.log('✅ Updated existing date');
    } else {
      // Add new date
      doctor.availability.push({
        date: new Date(date),
        timeSlots
      });
      console.log('✅ Added new date');
    }

    // Save without validation to avoid pmdcId requirement issues
    await doctor.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability: doctor.availability }
    });
  } catch (error) {
    console.error('❌ Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability: ' + error.message,
      error: error.message
    });
  }
});

// @route   GET /api/doctor/availability
// @desc    Get doctor's availability
// @access  Doctor only
router.get('/availability', protect, doctorOnly, async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id).select('availability');

    res.json({
      success: true,
      data: doctor.availability
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability'
    });
  }
});

// @route   DELETE /api/doctor/availability/:dateId
// @desc    Delete availability for a specific date
// @access  Doctor only
router.delete('/availability/:dateId', protect, doctorOnly, async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);
    
    doctor.availability = doctor.availability.filter(
      avail => avail._id.toString() !== req.params.dateId
    );

    await doctor.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Availability deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting availability'
    });
  }
});

// @route   GET /api/doctor/appointments
// @desc    Get doctor's appointments
// @access  Doctor only
router.get('/appointments', protect, doctorOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: 1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments'
    });
  }
});

// @route   GET /api/doctor/prescriptions
// @desc    Get current doctor's prescriptions
// @access  Doctor only
router.get('/prescriptions', protect, doctorOnly, getDoctorPrescriptions);

module.exports = router;
