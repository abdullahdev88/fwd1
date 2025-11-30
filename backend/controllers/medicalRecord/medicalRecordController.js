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
      patientId,
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

    // Validate patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Validate appointment if provided
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
          appointment.patient.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create records for your own appointments'
        });
      }
    }

    // Create medical record
    const medicalRecord = await MedicalRecord.create({
      patient: patientId,
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

module.exports = {
  createMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getDoctorMedicalRecords,
  getAllMedicalRecords
};