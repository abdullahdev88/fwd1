const Appointment = require('../../models/Appointment');
const User = require('../../models/User');

// @desc    Create appointment booking request
// @route   POST /api/appointments/book
// @access  Patient only
const bookAppointment = async (req, res) => {
  try {
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can book appointments'
      });
    }

    const {
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      requestMessage
    } = req.body;

    // Validate doctor exists and is actually a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if appointment slot is already taken
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      startTime,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This appointment slot is already booked or pending approval'
      });
    }

    // Create appointment request
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate,
      startTime,
      endTime,
      requestMessage,
      status: 'pending'
    });

    // Populate the appointment with patient and doctor info
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Appointment request sent to doctor for approval',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Book Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment'
    });
  }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments/my-appointments
// @access  Patient only
const getMyAppointments = async (req, res) => {
  try {
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can access this endpoint'
      });
    }

    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error('Get My Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's appointment requests
// @route   GET /api/appointments/doctor-requests
// @access  Doctor only
const getDoctorAppointmentRequests = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const { status = 'pending' } = req.query;

    const appointments = await Appointment.find({ 
      doctor: req.user.id,
      status: status 
    })
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error('Get Doctor Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all doctor's appointments (approved, completed, etc.)
// @route   GET /api/appointments/doctor-appointments
// @access  Doctor only
const getDoctorAppointments = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error('Get Doctor Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve appointment request
// @route   PUT /api/appointments/:appointmentId/approve
// @access  Doctor only
const approveAppointment = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can approve appointments'
      });
    }

    const { appointmentId } = req.params;
    const { notes } = req.body;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify this doctor owns the appointment
    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve your own appointment requests'
      });
    }

    // Check if appointment is in pending status
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be approved'
      });
    }

    // Update appointment status
    appointment.status = 'approved';
    appointment.approvedAt = new Date();
    if (notes) appointment.notes = notes;
    
    await appointment.save();

    // Populate and return updated appointment
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    res.status(200).json({
      success: true,
      message: 'Appointment approved successfully',
      data: updatedAppointment
    });

  } catch (error) {
    console.error('Approve Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving appointment'
    });
  }
};

// @desc    Reject appointment request
// @route   PUT /api/appointments/:appointmentId/reject
// @access  Doctor only
const rejectAppointment = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can reject appointments'
      });
    }

    const { appointmentId } = req.params;
    const { rejectionReason } = req.body;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify this doctor owns the appointment
    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject your own appointment requests'
      });
    }

    // Check if appointment is in pending status
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be rejected'
      });
    }

    // Update appointment status
    appointment.status = 'rejected';
    if (rejectionReason) appointment.rejectionReason = rejectionReason;
    
    await appointment.save();

    // Populate and return updated appointment
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    res.status(200).json({
      success: true,
      message: 'Appointment rejected',
      data: updatedAppointment
    });

  } catch (error) {
    console.error('Reject Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting appointment'
    });
  }
};

// @desc    Get all appointments (Admin only)
// @route   GET /api/appointments/admin/all
// @access  Admin only
const getAllAppointments = async (req, res) => {
  try {
    // Verify user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access all appointments'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalAppointments = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      totalAppointments,
      totalPages: Math.ceil(totalAppointments / limit),
      currentPage: page,
      data: appointments
    });

  } catch (error) {
    console.error('Get All Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get available doctors for booking
// @route   GET /api/appointments/available-doctors
// @access  Patient only
const getAvailableDoctors = async (req, res) => {
  try {
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can view available doctors'
      });
    }

    const doctors = await User.find({ role: 'doctor' })
      .select('name email specialization phone')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });

  } catch (error) {
    console.error('Get Available Doctors Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointmentRequests,
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
  getAllAppointments,
  getAvailableDoctors
};