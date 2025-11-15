const express = require('express');
const {
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  createPrescription,
  updateAvailability
} = require('../controllers/doctor/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and doctor-only
router.use(protect);
router.use(authorizeRole('doctor'));

router.get('/dashboard', getDoctorDashboard);
router.get('/appointments', getDoctorAppointments);
router.put('/appointments/:id', updateAppointmentStatus);
router.post('/prescriptions', createPrescription);
router.put('/availability', updateAvailability);

module.exports = router;
