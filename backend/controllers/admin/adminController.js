const Prescription = require('../../models/Prescription');

// @desc    Get all prescriptions for admin overview
// @route   GET /api/admin/prescriptions
// @access  Admin only
const getAdminPrescriptions = async (req, res) => {
  try {
    // Verify user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this endpoint'
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const doctorId = req.query.doctorId;
    const patientId = req.query.patientId;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (doctorId) {
      query.doctor = doctorId;
    }
    
    if (patientId) {
      query.patient = patientId;
    }

    // Build aggregation pipeline
    let pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      }
    ];

    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Prescription.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    const prescriptions = await Prescription.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: prescriptions
    });

  } catch (error) {
    console.error('Get Admin Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAdminPrescriptions
};