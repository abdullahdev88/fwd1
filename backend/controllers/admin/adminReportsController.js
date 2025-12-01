const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');

// Helper function to get date ranges for filtering
const getDateRangeFilter = (period, customStart, customEnd) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'custom':
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
  }

  return { startDate, endDate };
};

// @desc    Get overview statistics
// @route   GET /api/admin/reports/overview
// @access  Admin only
const getOverviewStats = async (req, res) => {
  try {
    const { period = 'month', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRangeFilter(period, customStart, customEnd);

    // Get current date for today's stats
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // Parallel queries for better performance
    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      totalPrescriptions,
      todayPrescriptions,
      pendingAppointments
    ] = await Promise.all([
      User.countDocuments({ role: 'doctor', status: 'approved' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
      Appointment.countDocuments({ 
        appointmentDate: { $gte: startOfToday, $lt: endOfToday }
      }),
      Appointment.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      Appointment.countDocuments({ 
        status: 'cancelled',
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      Prescription.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
      Prescription.countDocuments({ 
        createdAt: { $gte: startOfToday, $lt: endOfToday }
      }),
      Appointment.countDocuments({ 
        status: 'scheduled',
        appointmentDate: { $gte: new Date() }
      })
    ]);

    // Calculate scheduled appointments (future appointments)
    const scheduledAppointments = await Appointment.countDocuments({
      status: 'scheduled',
      appointmentDate: { $gte: new Date() }
    });

    // Get recent appointments for activity feed
    const recentAppointments = await Appointment.find({
      createdAt: { $gte: startDate, $lt: endDate }
    })
    .populate('patient', 'name email')
    .populate('doctor', 'name specialization')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    res.json({
      success: true,
      data: {
        overview: {
          totalDoctors,
          totalPatients,
          totalAppointments,
          totalPrescriptions,
          todayAppointments,
          todayPrescriptions
        },
        appointmentStats: {
          pendingAppointments,
          scheduledAppointments,
          completedAppointments,
          cancelledAppointments
        },
        prescriptionStats: {
          totalPrescriptions
        },
        recentAppointments
      }
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message
    });
  }
};

// @desc    Get doctor performance metrics
// @route   GET /api/admin/reports/doctors
// @access  Admin only
const getDoctorPerformance = async (req, res) => {
  try {
    const { period = 'month', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRangeFilter(period, customStart, customEnd);

    // Get doctor performance data using aggregation
    const doctorStats = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
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
        $unwind: '$doctorInfo'
      },
      {
        $group: {
          _id: '$doctor',
          doctorName: { $first: '$doctorInfo.name' },
          specialization: { $first: '$doctorInfo.specialization' },
          email: { $first: '$doctorInfo.email' },
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          uniquePatients: { $addToSet: '$patient' }
        }
      },
      {
        $addFields: {
          uniquePatients: { $size: '$uniquePatients' },
          completionRate: {
            $multiply: [
              {
                $divide: ['$completedAppointments', '$totalAppointments']
              },
              100
            ]
          }
        }
      },
      {
        $sort: { totalAppointments: -1 }
      }
    ]);

    // Get prescription counts per doctor
    const prescriptionStats = await Prescription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
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
        $unwind: '$doctorInfo'
      },
      {
        $group: {
          _id: '$doctor',
          doctorName: { $first: '$doctorInfo.name' },
          prescriptionCount: { $sum: 1 }
        }
      }
    ]);

    // Merge appointment and prescription data
    const doctors = doctorStats.map(doctor => {
      const prescriptionData = prescriptionStats.find(
        p => p._id.toString() === doctor._id.toString()
      );
      return {
        ...doctor,
        prescriptionCount: prescriptionData ? prescriptionData.prescriptionCount : 0
      };
    });

    // Top performers (top 5 doctors by appointments)
    const topPerformers = doctors.slice(0, 5);

    res.json({
      success: true,
      data: {
        doctors,
        topPerformers,
        totalDoctors: doctors.length
      }
    });
  } catch (error) {
    console.error('Get Doctor Performance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor performance data'
    });
  }
};

// @desc    Get appointment statistics and analytics
// @route   GET /api/admin/reports/appointments
// @access  Admin only
const getAppointmentStats = async (req, res) => {
  try {
    const { period = 'month', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRangeFilter(period, customStart, customEnd);

    // Monthly appointment trends
    const monthlyTrends = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    // Status distribution
    const statusStats = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Time distribution (peak hours)
    const timeDistribution = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $project: {
          hour: { $hour: '$appointmentDate' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          hour: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        monthlyTrends,
        statusDistribution: statusStats,
        timeDistribution,
        totalAppointments: await Appointment.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate }
        })
      }
    });
  } catch (error) {
    console.error('Get Appointment Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment statistics'
    });
  }
};

// @desc    Get patient demographics and statistics
// @route   GET /api/admin/reports/patients
// @access  Admin only
const getPatientReports = async (req, res) => {
  try {
    const { period = 'month', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRangeFilter(period, customStart, customEnd);

    const totalPatients = await User.countDocuments({ role: 'patient' });

    // Patient registration trends
    const registrationTrend = await User.aggregate([
      {
        $match: {
          role: 'patient',
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    // Most visited doctors
    const doctorVisits = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
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
        $unwind: '$doctorInfo'
      },
      {
        $group: {
          _id: '$doctor',
          doctorName: { $first: '$doctorInfo.name' },
          specialization: { $first: '$doctorInfo.specialization' },
          visitCount: { $sum: 1 },
          uniquePatients: { $addToSet: '$patient' }
        }
      },
      {
        $addFields: {
          uniquePatients: { $size: '$uniquePatients' }
        }
      },
      {
        $sort: { visitCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        newPatients: registrationTrend.reduce((sum, item) => sum + item.count, 0),
        registrationTrend,
        mostVisitedDoctors: doctorVisits
      }
    });
  } catch (error) {
    console.error('Get Patient Reports Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient reports'
    });
  }
};

// @desc    Get prescription analytics
// @route   GET /api/admin/reports/prescriptions
// @access  Admin only
const getPrescriptionAnalytics = async (req, res) => {
  try {
    const { period = 'month', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRangeFilter(period, customStart, customEnd);

    const totalPrescriptions = await Prescription.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });

    // Monthly prescription trends
    const monthlyPrescriptions = await Prescription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    // Most prescribed medications
    const medicationFrequency = await Prescription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $unwind: '$medications'
      },
      {
        $group: {
          _id: '$medications.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      },
      {
        $project: {
          medication: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Prescriptions per doctor
    const prescriptionsPerDoctor = await Prescription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
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
        $unwind: '$doctorInfo'
      },
      {
        $group: {
          _id: '$doctor',
          doctorName: { $first: '$doctorInfo.name' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalPrescriptions,
        monthlyPrescriptions,
        medicationFrequency,
        prescriptionsPerDoctor
      }
    });
  } catch (error) {
    console.error('Get Prescription Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescription analytics'
    });
  }
};

module.exports = {
  getOverviewStats,
  getDoctorPerformance,
  getAppointmentStats,
  getPatientReports,
  getPrescriptionAnalytics
};
