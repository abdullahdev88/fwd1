const Prescription = require('../../models/Prescription');
const User = require('../../models/User');

// @desc    Get all prescriptions for current doctor
// @route   GET /api/doctor/prescriptions
// @access  Doctor only
const getDoctorPrescriptions = async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const patientName = req.query.patientName;

    // Build base query
    let query = { doctor: req.user.id };
    
    if (status) {
      query.status = status;
    }

    // If patient name is provided, first find matching patients
    if (patientName) {
      const matchingPatients = await User.find({
        name: { $regex: patientName, $options: 'i' },
        role: 'patient'
      }).select('_id');
      
      const patientIds = matchingPatients.map(patient => patient._id);
      query.patient = { $in: patientIds };
    }

    // Get total count for pagination
    const total = await Prescription.countDocuments(query);

    // Get prescriptions with population
    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate startTime endTime status')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: prescriptions
    });

  } catch (error) {
    console.error('Get Doctor Prescriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getDoctorPrescriptions
};