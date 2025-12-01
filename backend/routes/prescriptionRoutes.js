const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPrescription,
  getPrescriptionById,
  getMyPrescriptions,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription,
  getPrescriptionByAppointment
} = require('../controllers/prescription/prescriptionController');

// @route   POST /api/prescriptions
// @desc    Create a new prescription
// @access  Doctor only
router.post('/', protect, createPrescription);

// @route   GET /api/prescriptions/me
// @desc    Get current patient's prescriptions
// @access  Patient only
router.get('/me', protect, getMyPrescriptions);

// @route   GET /api/prescriptions/doctor/my-prescriptions
// @desc    Get current doctor's prescriptions
// @access  Doctor only
router.get('/doctor/my-prescriptions', protect, getDoctorPrescriptions);

// @route   GET /api/prescriptions
// @desc    Get all prescriptions (Admin only)
// @access  Admin only
router.get('/', protect, getAllPrescriptions);

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get prescriptions for a specific patient
// @access  Doctor (own patients), Admin (all)
router.get('/patient/:patientId', protect, getPatientPrescriptions);

// @route   GET /api/prescriptions/appointment/:appointmentId
// @desc    Get prescription by appointment ID
// @access  Patient (own), Doctor (own), Admin (all)
router.get('/appointment/:appointmentId', protect, getPrescriptionByAppointment);

// @route   GET /api/prescriptions/:id
// @desc    Get prescription by ID
// @access  Patient (own), Doctor (own), Admin (all)
router.get('/:id', protect, getPrescriptionById);

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Doctor (own), Admin
router.put('/:id', protect, updatePrescription);

// @route   DELETE /api/prescriptions/:id
// @desc    Delete prescription
// @access  Admin only
router.delete('/:id', protect, deletePrescription);

module.exports = router;