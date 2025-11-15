const express = require('express');
const {
  getPatientDashboard,
  getPatientAppointments,
  bookAppointment,
  getPatientPrescriptions
} = require('../controllers/patient/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and patient-only
router.use(protect);
router.use(authorizeRole('patient'));

router.get('/dashboard', getPatientDashboard);
router.get('/appointments', getPatientAppointments);
router.post('/appointments', bookAppointment);
router.get('/prescriptions', getPatientPrescriptions);

module.exports = router;
