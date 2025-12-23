const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  uploadMedicalReports
} = require('../controllers/patient/medicalReportController');

router.post(
  '/upload',
  protect,
  authorizeRole('patient'),
  upload.array('attachments', 5),
  uploadMedicalReports
);

module.exports = router;
