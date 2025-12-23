const express = require('express');
const {
  bookAppointment,
  uploadMedicalReports,
  upload,
  getMyAppointments,
  getDoctorAppointmentRequests,
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
  getAllAppointments,
  getAvailableDoctors
} = require('../controllers/appointment/appointmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Patient routes
router.post('/book', bookAppointment); // Patient books appointment
router.post('/:appointmentId/upload-reports', upload.array('reports', 5), uploadMedicalReports); // Patient uploads medical reports (Feature 1)
router.get('/my-appointments', getMyAppointments); // Patient views their appointments
router.get('/available-doctors', getAvailableDoctors); // Patient views available doctors

// Doctor routes
router.get('/doctor-requests', getDoctorAppointmentRequests); // Doctor views pending requests
router.get('/doctor-appointments', getDoctorAppointments); // Doctor views all their appointments
router.put('/:appointmentId/approve', approveAppointment); // Doctor approves appointment
router.put('/:appointmentId/reject', rejectAppointment); // Doctor rejects appointment

// Admin routes
router.get('/admin/all', getAllAppointments); // Admin views all appointments

module.exports = router;