const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const MedicalReport = require('../../models/MedicalReport');
const { sendNotification } = require('../../utils/notificationService');
const { sendAppointmentConfirmationEmail } = require('../../services/emailService');
const { generateNotificationMessage } = require('../../services/aiMessageGenerator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/medical-reports');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs only
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

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

    // Send notification to patient
    await sendNotification('APPOINTMENT_BOOKED', req.user, { appointmentId: appointment._id });

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

// @desc    Upload medical reports for an appointment (Feature 1)
// @route   POST /api/appointments/:appointmentId/upload-reports
// @access  Patient only
const uploadMedicalReports = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify patient owns this appointment
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload reports for your own appointments'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Create medical report records
    const reportIds = [];
    const uploadedReports = [];

    for (const file of req.files) {
      const medicalReport = await MedicalReport.create({
        patient: req.user.id,
        appointment: appointmentId,
        reportType: req.body.reportType || 'other',
        fileName: file.originalname,
        fileUrl: `/uploads/medical-reports/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: req.body.description || ''
      });

      reportIds.push(medicalReport._id);
      uploadedReports.push(medicalReport);
    }

    // Update appointment with medical reports
    appointment.medicalReports = [...appointment.medicalReports, ...reportIds];
    appointment.hasMedicalReports = true;
    await appointment.save();

    // Send notification
    await sendNotification('REPORTS_UPLOADED', req.user, { appointmentId });

    res.status(200).json({
      success: true,
      message: `${uploadedReports.length} medical report(s) uploaded successfully`,
      data: {
        appointment: appointmentId,
        reports: uploadedReports
      }
    });

  } catch (error) {
    console.error('Upload Medical Reports Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading reports'
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
    const { notes, consultationFee } = req.body;

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
    if (consultationFee !== undefined && consultationFee !== null) {
      appointment.consultationFee = consultationFee;
    }
    
    await appointment.save();

    // Populate and return updated appointment
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone specialization');

    // Send instant AI-enhanced email notification to patient
    try {
      console.log('📧 Sending AI-enhanced appointment approval email to patient...');
      
      // Send AI-enhanced Email notification only
      await sendAppointmentConfirmationEmail(updatedAppointment, 'patient');
      
      console.log('✅ AI-enhanced approval email sent to patient');
    } catch (notificationError) {
      console.error('⚠️ Error sending approval email:', notificationError.message);
      // Don't fail the approval if notification fails
    }

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
  uploadMedicalReports,
  upload, // Export multer middleware
  getMyAppointments,
  getDoctorAppointmentRequests,
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
  getAllAppointments,
  getAvailableDoctors
};