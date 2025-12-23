const SecondOpinionRequest = require('../../models/SecondOpinionRequest');
const User = require('../../models/User');
const { sendNotification } = require('../../utils/notificationService');
const { sendAppointmentConfirmationEmail } = require('../../services/emailService');
const { generateNotificationMessage } = require('../../services/aiMessageGenerator');

// @desc    Get all pending second opinion requests (for admin/assignment)
// @route   GET /api/second-opinions/doctor/pending
// @access  Doctor only
const getPendingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const requests = await SecondOpinionRequest.find({ status: 'pending' })
      .populate('patient', 'name email phone age gender')
      .populate('medicalReports')
      .sort({ priority: -1, requestDate: 1 }); // Urgent first, then oldest

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error('Get Pending Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending requests'
    });
  }
};

// @desc    Get doctor's assigned second opinion requests
// @route   GET /api/second-opinions/doctor/my-cases
// @access  Doctor only
const getMyCases = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const { status } = req.query;
    
    const filter = { assignedDoctor: req.user.id };
    if (status) {
      filter.status = status;
    }

    const cases = await SecondOpinionRequest.find(filter)
      .populate('patient', 'name email phone age gender')
      .populate('medicalReports')
      .sort({ requestDate: -1 });

    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });

  } catch (error) {
    console.error('Get My Cases Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cases'
    });
  }
};

// @desc    Accept a second opinion request
// @route   PUT /api/second-opinions/doctor/:requestId/accept
// @access  Doctor only
const acceptRequest = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can accept requests'
      });
    }

    const { requestId } = req.params;

    const request = await SecondOpinionRequest.findById(requestId)
      .populate('patient', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Second opinion request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status: ${request.status}`
      });
    }

    // Assign to doctor and update status
    request.assignedDoctor = req.user.id;
    request.status = 'assigned';
    request.assignedDate = new Date();
    request.notifications.push({
      type: 'assigned',
      message: 'Doctor has accepted your request'
    });
    await request.save();

    // Send notification to patient
    await sendNotification('SECOND_OPINION_ASSIGNED', request.patient, {
      requestId: request._id,
      doctorName: req.user.name
    });

    // Send notification to doctor
    await sendNotification('NEW_SECOND_OPINION_REQUEST', req.user, {
      requestId: request._id
    });

    res.status(200).json({
      success: true,
      message: 'Second opinion request accepted',
      data: request
    });

  } catch (error) {
    console.error('Accept Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting request'
    });
  }
};

// @desc    Start reviewing a second opinion request
// @route   PUT /api/second-opinions/doctor/:requestId/start-review
// @access  Doctor only
const startReview = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can review cases'
      });
    }

    const { requestId } = req.params;

    const request = await SecondOpinionRequest.findById(requestId)
      .populate('patient', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Second opinion request not found'
      });
    }

    // Verify this doctor is assigned
    if (request.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your assigned cases'
      });
    }

    if (request.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot start review for status: ${request.status}`
      });
    }

    request.status = 'under_review';
    request.notifications.push({
      type: 'under_review',
      message: 'Doctor is reviewing your case'
    });
    await request.save();

    // Send notification to patient
    await sendNotification('SECOND_OPINION_UNDER_REVIEW', request.patient, {
      requestId: request._id
    });

    res.status(200).json({
      success: true,
      message: 'Review started',
      data: request
    });

  } catch (error) {
    console.error('Start Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting review'
    });
  }
};

// @desc    Submit doctor's opinion
// @route   PUT /api/second-opinions/doctor/:requestId/submit-opinion
// @access  Doctor only
const submitOpinion = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can submit opinions'
      });
    }

    const { requestId } = req.params;
    const {
      diagnosis,
      recommendations,
      prescribedTreatment,
      additionalNotes
    } = req.body;

    // Validate required fields
    if (!diagnosis || !recommendations) {
      return res.status(400).json({
        success: false,
        message: 'Diagnosis and recommendations are required'
      });
    }

    const request = await SecondOpinionRequest.findById(requestId)
      .populate('patient', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Second opinion request not found'
      });
    }

    // Verify this doctor is assigned
    if (request.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit opinions for your assigned cases'
      });
    }

    if (!['assigned', 'under_review'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit opinion for status: ${request.status}`
      });
    }

    // Update with doctor's opinion
    request.doctorOpinion = {
      diagnosis,
      recommendations,
      prescribedTreatment: prescribedTreatment || '',
      additionalNotes: additionalNotes || '',
      submittedAt: new Date()
    };
    request.status = 'completed';
    request.completedDate = new Date();
    request.notifications.push({
      type: 'completed',
      message: 'Second opinion completed'
    });
    await request.save();

    // Populate doctor details for notification
    await request.populate('assignedDoctor', 'name specialization');

    // Send instant notifications to patient
    try {
      console.log('📧 Sending second opinion completion notifications to patient...');
      
      // 1. Send Email notification
      const nodemailer = require('nodemailer');
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

        const emailContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .badge { background: #51cf66; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
              .opinion-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .label { font-weight: bold; color: #667eea; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏥 HospitalCare System</h1>
                <p>Second Opinion Ready</p>
              </div>
              <div class="content">
                <span class="badge">✅ Opinion Submitted</span>
                <h2>Hello ${request.patient.name},</h2>
                <p>Great news! Dr. ${request.assignedDoctor.name} has submitted their second opinion for your case.</p>
                
                <div class="opinion-box">
                  <h3 style="color: #667eea; margin-top: 0;">Medical Opinion Summary</h3>
                  <div class="label">🔬 Diagnosis:</div>
                  <p>${diagnosis}</p>
                  <div class="label">💊 Recommendations:</div>
                  <p>${recommendations}</p>
                  ${prescribedTreatment ? `<div class="label">💉 Prescribed Treatment:</div><p>${prescribedTreatment}</p>` : ''}
                  ${additionalNotes ? `<div class="label">📝 Additional Notes:</div><p>${additionalNotes}</p>` : ''}
                </div>
                
                <p style="color: #666; margin-top: 20px;">
                  Please log in to your account to view the complete details and ask any follow-up questions if needed.
                </p>
                
                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                  <p>This is an automated notification from HospitalCare System.</p>
                  <p>For queries, contact us at ${process.env.EMAIL_USER || 'support@hospitalcare.com'}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"HospitalCare System" <${process.env.EMAIL_USER}>`,
          to: request.patient.email,
          subject: 'Second Opinion Ready - HospitalCare System',
          html: emailContent
        });
        console.log(`✅ Email sent to patient: ${request.patient.email}`);
      }

      // All notifications sent via AI-enhanced email only
      
      console.log('✅ Second opinion completion notifications sent');
    } catch (notificationError) {
      console.error('⚠️ Error sending completion notifications:', notificationError.message);
      // Don't fail the submission if notifications fail
    }

    // Send legacy notification
    await sendNotification('SECOND_OPINION_COMPLETED', request.patient, {
      requestId: request._id
    });

    res.status(200).json({
      success: true,
      message: 'Second opinion submitted successfully',
      data: request
    });

  } catch (error) {
    console.error('Submit Opinion Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting opinion'
    });
  }
};

// @desc    Get single case details for doctor
// @route   GET /api/second-opinions/doctor/:requestId
// @access  Doctor (assigned) only
const getCaseDetails = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const { requestId } = req.params;

    const request = await SecondOpinionRequest.findById(requestId)
      .populate('patient', 'name email phone age gender medicalHistory')
      .populate('medicalReports');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Second opinion request not found'
      });
    }

    // Doctor can view if it's pending or assigned to them
    if (request.status !== 'pending' && request.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your assigned cases'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Get Case Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching case details'
    });
  }
};

module.exports = {
  getPendingRequests,
  getMyCases,
  acceptRequest,
  startReview,
  submitOpinion,
  getCaseDetails
};
