const Prescription = require('../../models/Prescription');
const User = require('../../models/User');
const Appointment = require('../../models/Appointment');

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Doctor only
const createPrescription = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create prescriptions'
      });
    }

    const {
      patientId,
      appointmentId,
      diagnosis,
      symptoms,
      medicines,
      labTests,
      instructions,
      followUpDate
    } = req.body;

    // Validate required fields
    if (!patientId || !appointmentId || !diagnosis || !medicines || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, Appointment ID, diagnosis, and at least one medicine are required'
      });
    }

    // Verify that the appointment belongs to this doctor and patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only create prescriptions for your own appointments'
      });
    }

    if (appointment.patient.toString() !== patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID does not match the appointment'
      });
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await Prescription.findOne({ appointment: appointmentId });
    if (existingPrescription) {
      return res.status(400).json({
        success: false,
        message: 'A prescription already exists for this appointment'
      });
    }

    // Create prescription
    const prescriptionData = {
      patient: patientId,
      doctor: req.user.id,
      appointment: appointmentId,
      diagnosis: diagnosis.trim(),
      symptoms: symptoms || [],
      medicines,
      labTests: labTests || [],
      instructions: instructions || '',
      followUpDate: followUpDate || null
    };

    const prescription = await Prescription.create(prescriptionData);

    // Populate the prescription with related data
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate startTime endTime status');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: populatedPrescription
    });

  } catch (error) {
    console.error('Create Prescription Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating prescription'
    });
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Patient (own), Doctor (own), Admin (all)
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate startTime endTime status');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if user can view this prescription
    if (!prescription.isViewableBy(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this prescription'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('Get Prescription By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescription'
    });
  }
};

// @desc    Get patient's prescriptions
// @route   GET /api/prescriptions/me
// @access  Patient only
const getMyPrescriptions = async (req, res) => {
  try {
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can access this endpoint'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const query = { patient: req.user.id };
    if (status) query.status = status;

    const prescriptions = await Prescription.findByPatient(req.user.id, query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPrescriptions = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      totalPrescriptions,
      totalPages: Math.ceil(totalPrescriptions / limit),
      currentPage: page,
      data: prescriptions
    });

  } catch (error) {
    console.error('Get My Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescriptions'
    });
  }
};

// @desc    Get prescriptions for a specific patient (Doctor and Admin)
// @route   GET /api/prescriptions/patient/:patientId
// @access  Doctor (own patients), Admin (all)
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Only doctors and admins can access this endpoint
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = { patient: patientId };
    if (status) query.status = status;

    // If user is a doctor, only show prescriptions they created
    if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }

    const prescriptions = await Prescription.findByPatient(patientId, query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPrescriptions = await Prescription.countDocuments(query);

    // Get patient info
    const patient = await User.findById(patientId).select('name email phone');
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      totalPrescriptions,
      totalPages: Math.ceil(totalPrescriptions / limit),
      currentPage: page,
      patient: patient,
      data: prescriptions
    });

  } catch (error) {
    console.error('Get Patient Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescriptions'
    });
  }
};

// @desc    Get doctor's prescriptions
// @route   GET /api/prescriptions/doctor/my-prescriptions
// @access  Doctor only
const getDoctorPrescriptions = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const { page = 1, limit = 10, status, patientName } = req.query;
    
    let query = { doctor: req.user.id };
    if (status) query.status = status;

    let prescriptions = await Prescription.findByDoctor(req.user.id, query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by patient name if provided
    if (patientName) {
      prescriptions = prescriptions.filter(p => 
        p.patient.name.toLowerCase().includes(patientName.toLowerCase())
      );
    }

    const totalPrescriptions = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      totalPrescriptions,
      totalPages: Math.ceil(totalPrescriptions / limit),
      currentPage: page,
      data: prescriptions
    });

  } catch (error) {
    console.error('Get Doctor Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescriptions'
    });
  }
};

// @desc    Get all prescriptions (Admin only)
// @route   GET /api/prescriptions
// @access  Admin only
const getAllPrescriptions = async (req, res) => {
  try {
    // Verify user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access all prescriptions'
      });
    }

    const { page = 1, limit = 20, status, doctorName, patientName } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate startTime endTime status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Apply name filters if provided
    let filteredPrescriptions = prescriptions;
    if (doctorName) {
      filteredPrescriptions = filteredPrescriptions.filter(p => 
        p.doctor.name.toLowerCase().includes(doctorName.toLowerCase())
      );
    }
    if (patientName) {
      filteredPrescriptions = filteredPrescriptions.filter(p => 
        p.patient.name.toLowerCase().includes(patientName.toLowerCase())
      );
    }

    const totalPrescriptions = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      count: filteredPrescriptions.length,
      totalPrescriptions,
      totalPages: Math.ceil(totalPrescriptions / limit),
      currentPage: page,
      data: filteredPrescriptions
    });

  } catch (error) {
    console.error('Get All Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescriptions'
    });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Doctor (own), Admin (all)
const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if user can edit this prescription
    if (!prescription.isEditableBy(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this prescription'
      });
    }

    const {
      diagnosis,
      symptoms,
      medicines,
      labTests,
      instructions,
      followUpDate,
      status
    } = req.body;

    // Update fields
    const updateFields = {};
    if (diagnosis !== undefined) updateFields.diagnosis = diagnosis.trim();
    if (symptoms !== undefined) updateFields.symptoms = symptoms;
    if (medicines !== undefined) updateFields.medicines = medicines;
    if (labTests !== undefined) updateFields.labTests = labTests;
    if (instructions !== undefined) updateFields.instructions = instructions;
    if (followUpDate !== undefined) updateFields.followUpDate = followUpDate;
    if (status !== undefined) updateFields.status = status;

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate startTime endTime status');

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: updatedPrescription
    });

  } catch (error) {
    console.error('Update Prescription Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating prescription'
    });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Admin only
const deletePrescription = async (req, res) => {
  try {
    // Only admins can delete prescriptions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete prescriptions'
      });
    }

    const { id } = req.params;

    const prescription = await Prescription.findById(id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    await Prescription.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    console.error('Delete Prescription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting prescription'
    });
  }
};

// @desc    Get prescription by appointment ID
// @route   GET /api/prescriptions/appointment/:appointmentId
// @access  Patient (own), Doctor (own), Admin (all)
const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findByAppointment(appointmentId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'No prescription found for this appointment'
      });
    }

    // Check if user can view this prescription
    if (!prescription.isViewableBy(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this prescription'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('Get Prescription By Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescription'
    });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionById,
  getMyPrescriptions,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription,
  getPrescriptionByAppointment
};