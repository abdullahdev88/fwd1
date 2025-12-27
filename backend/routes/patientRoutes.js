const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect, patientOnly } = require('../middleware/auth');

// @route   GET /api/patient/dashboard
// @desc    Get patient dashboard data
// @access  Patient only
router.get('/dashboard', protect, patientOnly, async (req, res) => {
  try {
    // Get patient's appointments
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization email')
      .sort({ appointmentDate: -1 })
      .limit(5);

    // Count statistics
    const totalAppointments = await Appointment.countDocuments({ patient: req.user.id });
    const upcomingAppointments = await Appointment.countDocuments({
      patient: req.user.id,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });
    const completedAppointments = await Appointment.countDocuments({
      patient: req.user.id,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        appointments,
        stats: {
          total: totalAppointments,
          upcoming: upcomingAppointments,
          completed: completedAppointments
        },
        user: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone
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

// @route   GET /api/patient/doctors
// @desc    Get all approved doctors with their availability
// @access  Patient only
router.get('/doctors', protect, patientOnly, async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      status: 'approved',
      isActive: true
    }).select('name specialization experience education availability');

    // Filter only available slots (not booked)
    const doctorsWithAvailability = doctors.map(doctor => {
      const availableSlots = doctor.availability.map(avail => ({
        _id: avail._id,
        date: avail.date,
        timeSlots: avail.timeSlots.filter(slot => !slot.isBooked)
      })).filter(avail => avail.timeSlots.length > 0);

      return {
        ...doctor.toObject(),
        availability: availableSlots
      };
    });

    res.json({
      success: true,
      data: doctorsWithAvailability
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors'
    });
  }
});

// @route   POST /api/patient/book-appointment
// @desc    Book an appointment with a doctor
// @access  Patient only
router.post('/book-appointment', protect, patientOnly, async (req, res) => {
  try {
    const { doctorId, dateId, slotIndex, notes } = req.body;
    const patientId = req.user.id;

    // Validate input
    if (!doctorId || !dateId || slotIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, date ID, and slot index are required'
      });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || doctor.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not approved'
      });
    }

    const availabilitySlot = doctor.availability.id(dateId);
    if (!availabilitySlot) {
      return res.status(404).json({
        success: false,
        message: 'Availability slot not found'
      });
    }

    const timeSlot = availabilitySlot.timeSlots[slotIndex];
    if (!timeSlot || timeSlot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available'
      });
    }

    // Mark slot as booked
    timeSlot.isBooked = true;
    timeSlot.bookedBy = patientId;

    // Create appointment record
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: availabilitySlot.date,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      notes: notes || ''
    });

    await Promise.all([
      doctor.save(),
      appointment.save()
    ]);

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization');

    res.json({
      success: true,
      message: 'Appointment booked successfully',
      data: populatedAppointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment'
    });
  }
});

// @route   GET /api/patient/appointments
// @desc    Get patient's appointments
// @access  Patient only
router.get('/appointments', protect, patientOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization email')
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
