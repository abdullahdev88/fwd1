const SecondOpinionRequest = require('../../models/SecondOpinionRequest');
const MedicalReport = require('../../models/MedicalReport');
const User = require('../../models/User');
const { sendNotification } = require('../../utils/notificationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads (same as appointment)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/medical-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `secondopinion-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// @desc    Submit a second opinion request
// @route   POST /api/second-opinions/submit
// @access  Patient only
const submitSecondOpinion = async (req, res) => {
  try {
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can request second opinions'
      });
    }

    const {
      doctorId,
      chiefComplaint,
      medicalHistory,
      currentMedications,
      allergies,
      priority
    } = req.body;

    // Validate required fields
    if (!chiefComplaint) {
      return res.status(400).json({
        success: false,
        message: 'Chief complaint is required'
      });
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a doctor'
      });
    }

    // Verify the selected doctor exists and is approved
    const doctor = await User.findOne({ 
      _id: doctorId, 
      role: 'doctor',
      status: 'approved'
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Selected doctor not found or not approved'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one medical report is required'
      });
    }

    // Create second opinion request with assigned doctor
    const secondOpinionRequest = await SecondOpinionRequest.create({
      patient: req.user.id,
      assignedDoctor: doctorId,
      chiefComplaint,
      medicalHistory: medicalHistory || '',
      currentMedications: currentMedications || '',
      allergies: allergies || '',
      priority: priority || 'normal',
      status: 'assigned' // Status is 'assigned' since doctor is pre-selected
    });

    // Upload and link medical reports
    const reportIds = [];
    for (const file of req.files) {
      const medicalReport = await MedicalReport.create({
        patient: req.user.id,
        secondOpinionRequest: secondOpinionRequest._id,
        reportType: req.body.reportType || 'other',
        fileName: file.originalname,
        fileUrl: `/uploads/medical-reports/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: req.body.description || ''
      });
      reportIds.push(medicalReport._id);
    }

    // Update second opinion request with reports
    secondOpinionRequest.medicalReports = reportIds;
    secondOpinionRequest.notifications.push({
      type: 'submitted',
      message: `Second opinion request submitted and assigned to Dr. ${doctor.name}`
    });
    await secondOpinionRequest.save();

    // Send notification to patient
    await sendNotification('SECOND_OPINION_SUBMITTED', req.user, {
      requestId: secondOpinionRequest._id,
      doctorName: doctor.name
    });

    // Send notification to assigned doctor
    await sendNotification('SECOND_OPINION_ASSIGNED', doctor, {
      requestId: secondOpinionRequest._id,
      patientName: req.user.name
    });

    // Populate and return
    const populatedRequest = await SecondOpinionRequest.findById(secondOpinionRequest._id)
      .populate('medicalReports')
      .populate('patient', 'name email phone')
      .populate('assignedDoctor', 'name email specialization experience');

    res.status(201).json({
      success: true,
      message: `Second opinion request submitted successfully and assigned to Dr. ${doctor.name}`,
      data: populatedRequest
    });

  } catch (error) {
    console.error('Submit Second Opinion Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting second opinion request'
    });
  }
};

// @desc    Get patient's second opinion requests
// @route   GET /api/second-opinions/my-requests
// @access  Patient only
const getMySecondOpinions = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can access this endpoint'
      });
    }

    const requests = await SecondOpinionRequest.find({ patient: req.user.id })
      .populate('assignedDoctor', 'name specialization email')
      .populate('medicalReports')
      .sort({ requestDate: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error('Get My Second Opinions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching second opinions'
    });
  }
};

// @desc    Get single second opinion request details
// @route   GET /api/second-opinions/:requestId
// @access  Patient (owner) only
const getSecondOpinionDetails = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await SecondOpinionRequest.findById(requestId)
      .populate('patient', 'name email phone')
      .populate('assignedDoctor', 'name specialization email')
      .populate('medicalReports');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Second opinion request not found'
      });
    }

    // Verify patient owns this request
    if (request.patient._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own second opinion requests'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Get Second Opinion Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching request details'
    });
  }
};

// @desc    Cancel a second opinion request
// @route   PUT /api/second-opinions/:requestId/cancel
// @access  Patient only
const cancelSecondOpinion = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await SecondOpinionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Second opinion request not found'
      });
    }

    // Verify patient owns this request
    if (request.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own requests'
      });
    }

    // Can only cancel pending or assigned requests
    if (!['pending', 'assigned'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status: ${request.status}`
      });
    }

    request.status = 'cancelled';
    request.notifications.push({
      type: 'message',
      message: 'Request cancelled by patient'
    });
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Second opinion request cancelled successfully',
      data: request
    });

  } catch (error) {
    console.error('Cancel Second Opinion Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling request'
    });
  }
};

module.exports = {
  submitSecondOpinion,
  getMySecondOpinions,
  getSecondOpinionDetails,
  cancelSecondOpinion,
  upload // Export multer middleware
};
