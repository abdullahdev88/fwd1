const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect, doctorOnly } = require('../middleware/auth');

// @route   POST /api/doctor/availability
// @desc    Add availability slots
// @access  Doctor only
router.post('/availability', protect, doctorOnly, async (req, res) => {
  try {
    const { date, timeSlots } = req.body;
    const doctorId = req.user.id;

    const doctor = await User.findById(doctorId);
    
    // Check if date already exists
    const existingDateIndex = doctor.availability.findIndex(
      avail => avail.date.toDateString() === new Date(date).toDateString()
    );

    if (existingDateIndex !== -1) {
      // Update existing date
      doctor.availability[existingDateIndex].timeSlots = timeSlots;
    } else {
      // Add new date
      doctor.availability.push({
        date: new Date(date),
        timeSlots
      });
    }

    await doctor.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: doctor.availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability'
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

    await doctor.save();

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

module.exports = router;
