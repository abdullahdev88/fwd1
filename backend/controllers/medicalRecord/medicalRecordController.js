const MedicalRecord = require('../../models/MedicalRecord');
const User = require('../../models/User');
const Appointment = require('../../models/Appointment');

// @desc    Create new medical record
// @route   POST /api/medical-records
// @access  Doctor only
const createMedicalRecord = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create medical records'
      });
    }

    const {
      // Support both old patientId and new patient identifier fields
      patientId,
      patientEmail,
      patientPhone,
      patientName,
      appointmentId,
      diagnosis,
      symptoms,
      notes,
      treatmentPlan,
      prescription,
      vitalSigns,
      labResults,
      followUpDate
    } = req.body;

    let patient = null;

    // PRIORITY 1: If appointment ID is provided, get patient from appointment
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Verify the appointment belongs to this doctor
      if (appointment.doctor.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only create records for your own appointments'
        });
      }

      // Get patient from appointment
      patient = await User.findById(appointment.patient);
    }
    // PRIORITY 2: Search by email (most unique)
    else if (patientEmail) {
      patient = await User.findOne({ 
        email: patientEmail.toLowerCase().trim(),
        role: 'patient' 
      });
    }
    // PRIORITY 3: Search by phone
    else if (patientPhone) {
      patient = await User.findOne({ 
        phone: patientPhone.trim(),
        role: 'patient' 
      });
    }
    // PRIORITY 4: Search by name (less unique, may have duplicates)
    else if (patientName) {
      patient = await User.findOne({ 
        name: { $regex: new RegExp('^' + patientName.trim(), 'i') },
        role: 'patient' 
      });
    }
    // FALLBACK: Direct patient ID (for backward compatibility)
    else if (patientId) {
      patient = await User.findById(patientId);
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'Please provide patient identifier (email, phone, name, or appointment ID)'
      });
    }

    // Validate patient exists and is a patient
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found. Please verify the patient information.'
      });
    }

    // Validate appointment if provided and not already checked
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Verify the appointment is between this doctor and patient
      if (appointment.doctor.toString() !== req.user.id || 
          appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only create records for your own appointments'
        });
      }
    }

    // Create medical record using resolved patient ID
    const medicalRecord = await MedicalRecord.create({
      patient: patient._id,  // Use resolved patient ID
      doctor: req.user.id,
      appointment: appointmentId || null,
      diagnosis,
      symptoms,
      notes: notes || '',
      treatmentPlan,
      prescription: prescription || '',
      vitalSigns: vitalSigns || {},
      labResults: labResults || '',
      followUpDate: followUpDate || null
    });

    // Populate and return the created record
    await medicalRecord.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name specialization' },
      { path: 'appointment', select: 'appointmentDate startTime' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: medicalRecord
    });

  } catch (error) {
    console.error('Create Medical Record Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get patient's own medical records
// @route   GET /api/medical-records/me
// @access  Patient only
const getMyMedicalRecords = async (req, res) => {
  try {
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can access this endpoint'
      });
    }

    const records = await MedicalRecord.findByPatient(req.user.id);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (error) {
    console.error('Get My Medical Records Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get medical records for a specific patient
// @route   GET /api/medical-records/patient/:id
// @access  Doctor + Admin
const getPatientMedicalRecords = async (req, res) => {
  try {
    const { id } = req.params;

    // Only doctors and admins can access this
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Verify patient exists
    const patient = await User.findById(id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    let records;
    
    if (req.user.role === 'doctor') {
      // Doctors can only see records they created for this patient
      records = await MedicalRecord.find({ 
        patient: id, 
        doctor: req.user.id 
      })
      .populate('patient', 'name email phone')
      .populate('appointment', 'appointmentDate startTime')
      .sort({ createdAt: -1 });
    } else {
      // Admins can see all records for this patient
      records = await MedicalRecord.findByPatient(id);
    }

    res.status(200).json({
      success: true,
      count: records.length,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email
      },
      data: records
    });

  } catch (error) {
    console.error('Get Patient Medical Records Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single medical record by ID
// @route   GET /api/medical-records/:recordId
// @access  Doctor (own records) + Patient (own records) + Admin
const getMedicalRecordById = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findById(recordId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate startTime status');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check permissions
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'patient') {
      // Patients can only view their own records
      if (record.patient._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own medical records'
        });
      }
    } else if (userRole === 'doctor') {
      // Doctors can only view records they created
      if (record.doctor._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view medical records you created'
        });
      }
    }
    // Admins can view any record (no additional check needed)

    res.status(200).json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Get Medical Record By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update medical record
// @route   PUT /api/medical-records/:recordId
// @access  Doctor (own records only)
const updateMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    // Only doctors can update records
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can edit medical records'
      });
    }

    const record = await MedicalRecord.findById(recordId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Doctors can only update their own records
    if (record.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update medical records you created'
      });
    }

    const updateFields = [
      'diagnosis', 'symptoms', 'notes', 'treatmentPlan', 
      'prescription', 'vitalSigns', 'labResults', 'followUpDate', 'status'
    ];

    const updateData = {};
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name specialization' },
      { path: 'appointment', select: 'appointmentDate startTime' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error('Update Medical Record Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:recordId
// @access  Admin only
const deleteMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    // Only admins can delete records
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete medical records'
      });
    }

    const record = await MedicalRecord.findById(recordId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    await MedicalRecord.findByIdAndDelete(recordId);

    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('Delete Medical Record Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's medical records (records created by the doctor)
// @route   GET /api/medical-records/doctor/my-records
// @access  Doctor only
const getDoctorMedicalRecords = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const records = await MedicalRecord.findByDoctor(req.user.id);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (error) {
    console.error('Get Doctor Medical Records Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all medical records (Admin only)
// @route   GET /api/medical-records/admin/all
// @access  Admin only
const getAllMedicalRecords = async (req, res) => {
  try {
    // Only admins can access all records
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can access all medical records'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const records = await MedicalRecord.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate startTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MedicalRecord.countDocuments();

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: records
    });

  } catch (error) {
    console.error('Get All Medical Records Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search patients by name, email, or phone (for doctors to find patients)
// @route   GET /api/medical-records/search/patients?query=...
// @access  Doctor only
const searchPatients = async (req, res) => {
  try {
    // Only doctors can search for patients
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can search for patients'
      });
    }

    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query (minimum 2 characters)'
      });
    }

    const searchTerm = query.trim();

    // Search patients by name, email, or phone
    // Using $or operator to search across multiple fields
    const patients = await User.find({
      role: 'patient',
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name email phone createdAt')
    .limit(20) // Limit results to 20 patients
    .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });

  } catch (error) {
    console.error('Search Patients Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's appointments with patient details (helps doctor select patient)
// @route   GET /api/medical-records/doctor/appointments
// @access  Doctor only
const getDoctorAppointments = async (req, res) => {
  try {
    // Only doctors can access
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    // Get appointments for this doctor
    const appointments = await Appointment.find({ 
      doctor: req.user.id,
      status: { $in: ['confirmed', 'completed'] } // Only confirmed or completed appointments
    })
    .populate('patient', 'name email phone')
    .select('appointmentDate startTime endTime status patient')
    .sort({ appointmentDate: -1 })
    .limit(50);

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

module.exports = {
  createMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getDoctorMedicalRecords,
  getAllMedicalRecords,
  searchPatients,
  getDoctorAppointments
};