const express = require('express');
const {
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
} = require('../controllers/medicalRecord/medicalRecordController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Patient search and appointment retrieval for doctors (must be before parameterized routes)
router.get('/search/patients', searchPatients); // Doctor only - search for patients
router.get('/doctor/appointments', getDoctorAppointments); // Doctor only - get appointments with patient details

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