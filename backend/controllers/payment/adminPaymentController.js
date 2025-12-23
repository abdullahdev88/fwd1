const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');

// @desc    Get all payments (Admin Dashboard)
// @route   GET /api/payments/admin/all
// @access  Admin only
const getAllPayments = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(filter)
      .populate('appointment')
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization')
      .populate('refundProcessedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    // Calculate statistics
    const stats = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      stats,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/admin/statistics
// @access  Admin only
const getPaymentStatistics = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const paidPayments = await Payment.countDocuments({ status: 'paid' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const refundRequests = await Payment.countDocuments({ status: 'refund_requested' });
    const refundedPayments = await Payment.countDocuments({ status: 'refunded' });

    // Calculate total revenue
    const revenueStats = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // Calculate refunded amount
    const refundStats = await Payment.aggregate([
      { $match: { status: 'refunded' } },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$refundAmount' }
        }
      }
    ]);

    const totalRefunded = refundStats.length > 0 ? refundStats[0].totalRefunded : 0;

    // Payment methods breakdown
    const paymentMethodsStats = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Recent payments
    const recentPayments = await Payment.find()
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      statistics: {
        totalPayments,
        paidPayments,
        pendingPayments,
        refundRequests,
        refundedPayments,
        totalRevenue,
        totalRefunded,
        netRevenue: totalRevenue - totalRefunded
      },
      paymentMethodsStats,
      recentPayments
    });

  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// @desc    Get refund requests
// @route   GET /api/payments/admin/refund-requests
// @access  Admin only
const getRefundRequests = async (req, res) => {
  try {
    const refundRequests = await Payment.find({ status: 'refund_requested' })
      .populate('appointment')
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization')
      .sort({ refundRequestedAt: -1 });

    res.status(200).json({
      success: true,
      count: refundRequests.length,
      data: refundRequests
    });

  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching refund requests',
      error: error.message
    });
  }
};

// @desc    Process refund (Admin Action)
// @route   PUT /api/payments/admin/:paymentId/process-refund
// @access  Admin only
const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { adminNotes } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('appointment')
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'refund_requested') {
      return res.status(400).json({
        success: false,
        message: 'This payment does not have a pending refund request'
      });
    }

    // Process refund (SIMULATED)
    payment.status = 'refunded';
    payment.refundAmount = payment.amount; // Full refund
    payment.refundProcessedAt = new Date();
    payment.refundProcessedBy = req.user.id;
    payment.adminNotes = adminNotes;
    payment.lastModifiedBy = req.user.id;

    await payment.save();

    // Update appointment status
    if (payment.appointment) {
      const appointment = await Appointment.findById(payment.appointment._id);
      if (appointment) {
        appointment.paymentStatus = 'refunded';
        appointment.status = 'cancelled';
        await appointment.save();
      }
    }

    console.log(`✅ Refund processed by admin for payment ${paymentId}`);
    console.log(`   Amount: PKR ${payment.refundAmount}`);
    console.log(`   Admin: ${req.user.name}`);

    // Populate for response
    const updatedPayment = await Payment.findById(paymentId)
      .populate('appointment')
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('refundProcessedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully (Simulated)',
      data: updatedPayment
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// @desc    Reject refund request
// @route   PUT /api/payments/admin/:paymentId/reject-refund
// @access  Admin only
const rejectRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { adminNotes } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'refund_requested') {
      return res.status(400).json({
        success: false,
        message: 'This payment does not have a pending refund request'
      });
    }

    // Reject refund - revert to paid status
    payment.status = 'paid';
    payment.adminNotes = adminNotes || 'Refund request rejected';
    payment.lastModifiedBy = req.user.id;

    await payment.save();

    console.log(`❌ Refund rejected by admin for payment ${paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Refund request rejected',
      data: payment
    });

  } catch (error) {
    console.error('Error rejecting refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting refund',
      error: error.message
    });
  }
};

// @desc    Update payment status manually
// @route   PUT /api/payments/admin/:paymentId/status
// @access  Admin only
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, adminNotes } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.status = status;
    if (adminNotes) payment.adminNotes = adminNotes;
    payment.lastModifiedBy = req.user.id;

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentStatistics,
  getRefundRequests,
  processRefund,
  rejectRefund,
  updatePaymentStatus
};
