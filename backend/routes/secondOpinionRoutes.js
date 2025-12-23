const express = require('express');
const {
  submitSecondOpinion,
  getMySecondOpinions,
  getSecondOpinionDetails,
  cancelSecondOpinion,
  upload
} = require('../controllers/patient/secondOpinionController');

const {
  getPendingRequests,
  getMyCases,
  acceptRequest,
  startReview,
  submitOpinion,
  getCaseDetails
} = require('../controllers/doctor/secondOpinionReviewController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ========== PATIENT ROUTES ==========

// Submit a new second opinion request with medical reports
router.post('/submit', upload.array('reports', 10), submitSecondOpinion);

// Get all my second opinion requests
router.get('/my-requests', getMySecondOpinions);

// Get single second opinion request details
router.get('/:requestId', getSecondOpinionDetails);

// Cancel a second opinion request
router.put('/:requestId/cancel', cancelSecondOpinion);


// ========== DOCTOR ROUTES ==========

// Get all pending second opinion requests (available for doctors to accept)
router.get('/doctor/pending', getPendingRequests);

// Get doctor's assigned cases
router.get('/doctor/my-cases', getMyCases);

// Get specific case details for doctor
router.get('/doctor/:requestId', getCaseDetails);

// Accept a second opinion request
router.put('/doctor/:requestId/accept', acceptRequest);

// Start reviewing a case
router.put('/doctor/:requestId/start-review', startReview);

// Submit doctor's opinion
router.put('/doctor/:requestId/submit-opinion', submitOpinion);


module.exports = router;
