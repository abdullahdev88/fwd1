const express = require('express');
const {
  createMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getDoctorMedicalRecords,
  getAllMedicalRecords
} = require('../controllers/medicalRecord/medicalRecordController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Medical record CRUD routes
router.post('/', createMedicalRecord); // Doctor only
router.get('/me', getMyMedicalRecords); // Patient only
router.get('/doctor/my-records', getDoctorMedicalRecords); // Doctor only
router.get('/admin/all', getAllMedicalRecords); // Admin only
router.get('/patient/:id', getPatientMedicalRecords); // Doctor + Admin
router.get('/:recordId', getMedicalRecordById); // Doctor (own) + Patient (own) + Admin
router.put('/:recordId', updateMedicalRecord); // Doctor (own) only
router.delete('/:recordId', deleteMedicalRecord); // Admin only

module.exports = router;