const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');
const User = require('../../models/User');

// @desc    Get patient dashboard data
// @route   GET /api/patient/dashboard
// @access  Private (Patient only)
const getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: patientId,
      appointmentDate: { $gte: new Date() },
      status: 'scheduled'
    })
    .populate('doctor', 'name specialization')
    .sort({ appointmentDate: 1 })
    .limit(5);

    // Get past appointments count
    const pastAppointmentsCount = await Appointment.countDocuments({
      patient: patientId,
      appointmentDate: { $lt: new Date() }
    });

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find({
      patient: patientId
    })
    .populate('doctor', 'name specialization')
    .sort({ createdAt: -1 })
    .limit(5);

    res.status(200).json({
      success: true,
      data: {
        upcomingAppointments,
        pastAppointmentsCount,
        recentPrescriptions,
        totalAppointments: upcomingAppointments.length + pastAppointmentsCount
      }
    });
  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// @desc    Get all patient appointments
// @route   GET /api/patient/appointments
// @access  Private (Patient only)
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization phone')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// @desc    Book new appointment
// @route   POST /api/patient/appointments
// @access  Private (Patient only)
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, symptoms } = req.body;

    // Verify doctor exists and is active
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or inactive'
      });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      'timeSlot.startTime': timeSlot.startTime,
      status: 'scheduled'
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      symptoms
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment: populatedAppointment }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
};

// @desc    Get patient prescriptions
// @route   GET /api/patient/prescriptions
// @access  Private (Patient only)
const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: { prescriptions }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message
    });
  }
};

module.exports = {
  getPatientDashboard,
  getPatientAppointments,
  bookAppointment,
  getPatientPrescriptions
};
