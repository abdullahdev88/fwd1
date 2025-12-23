const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  processPayment,
  getPaymentDetails,
  getPaymentByAppointment,
  getPatientPaymentHistory,
  getDoctorEarnings,
  requestRefund
} = require('../controllers/payment/paymentController');

const {
  getAllPayments,
  getPaymentStatistics,
  getRefundRequests,
  processRefund,
  rejectRefund,
  updatePaymentStatus
} = require('../controllers/payment/adminPaymentController');

// Patient Routes
router.post('/process', protect, authorize('patient'), processPayment);
router.get('/patient/history', protect, authorize('patient'), getPatientPaymentHistory);
router.post('/:paymentId/refund-request', protect, authorize('patient', 'doctor'), requestRefund);

// Doctor Routes
router.get('/doctor/earnings', protect, authorize('doctor'), getDoctorEarnings);

// General Routes (Patient/Doctor/Admin)
router.get('/:paymentId', protect, getPaymentDetails);
router.get('/appointment/:appointmentId', protect, getPaymentByAppointment);

// Admin Routes
router.get('/admin/all', protect, authorize('admin'), getAllPayments);
router.get('/admin/statistics', protect, authorize('admin'), getPaymentStatistics);
router.get('/admin/refund-requests', protect, authorize('admin'), getRefundRequests);
router.put('/admin/:paymentId/process-refund', protect, authorize('admin'), processRefund);
router.put('/admin/:paymentId/reject-refund', protect, authorize('admin'), rejectRefund);
router.put('/admin/:paymentId/status', protect, authorize('admin'), updatePaymentStatus);

module.exports = router;
