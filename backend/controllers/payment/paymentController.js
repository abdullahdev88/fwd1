const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');

// @desc    Process payment for consultation (Simulated)
// @route   POST /api/payments/process
// @access  Patient only
const processPayment = async (req, res) => {
  try {
    const { appointmentId, paymentMethod, phoneNumber } = req.body;

    // Validate appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify patient owns this appointment
    if (appointment.patient._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only make payment for your own appointments'
      });
    }

    // Check if appointment is approved
    if (appointment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made for approved appointments'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ appointment: appointmentId });
    if (existingPayment && existingPayment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been made for this appointment'
      });
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Determine payment status based on method
    const paymentStatus = paymentMethod === 'clinic_visit' ? 'pending' : 'paid';
    const appointmentPaymentStatus = paymentMethod === 'clinic_visit' ? 'pending' : 'paid';

    // Create payment record
    const payment = new Payment({
      appointment: appointmentId,
      patient: appointment.patient._id,
      doctor: appointment.doctor._id,
      amount: appointment.consultationFee || 2000,
      currency: 'PKR',
      paymentMethod,
      status: paymentStatus,
      phoneNumber: phoneNumber || null,
      description: paymentMethod === 'clinic_visit' 
        ? `Clinic Payment - Dr. ${appointment.doctor.name}`
        : `Online Consultation with Dr. ${appointment.doctor.name}`
    });

    await payment.save();

    // Update appointment with payment status
    appointment.paymentStatus = appointmentPaymentStatus;
    appointment.paymentId = payment._id;
    await appointment.save();

    // Populate payment for response
    const populatedPayment = await Payment.findById(payment._id)
      .populate('appointment')
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

    console.log(`💳 Payment processed successfully for appointment ${appointmentId}`);
    console.log(`   Transaction ID: ${payment.transactionId}`);
    console.log(`   Amount: PKR ${payment.amount}`);
    console.log(`   Method: ${paymentMethod}`);
    console.log(`   Status: ${paymentStatus}`);

    const successMessage = paymentMethod === 'clinic_visit' 
      ? 'Payment record created. Please complete payment at clinic reception. Doctor will confirm once received.'
      : 'Payment processed successfully (Simulated)';

    res.status(201).json({
      success: true,
      message: successMessage,
      data: populatedPayment
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Patient/Doctor/Admin
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('appointment')
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization')
      .populate('refundProcessedBy', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Authorization check
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && 
        payment.patient._id.toString() !== userId && 
        payment.doctor._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details',
      error: error.message
    });
  }
};

// @desc    Get payment by appointment
// @route   GET /api/payments/appointment/:appointmentId
// @access  Patient/Doctor/Admin
const getPaymentByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const payment = await Payment.findOne({ appointment: appointmentId })
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .populate('refundProcessedBy', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No payment found for this appointment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
};

// @desc    Get patient's payment history
// @route   GET /api/payments/patient/history
// @access  Patient only
const getPatientPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ patient: req.user.id })
      .populate('appointment')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

// @desc    Get doctor's payment records
// @route   GET /api/payments/doctor/earnings
// @access  Doctor only
const getDoctorEarnings = async (req, res) => {
  try {
    const payments = await Payment.find({ 
      doctor: req.user.id,
      status: { $in: ['pending', 'paid', 'refund_requested'] }
    })
      .populate('appointment')
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });

    // Calculate total earnings
    const totalEarnings = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const refundedAmount = payments
      .filter(p => p.status === 'refunded')
      .reduce((sum, payment) => sum + (payment.refundAmount || payment.amount), 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      totalEarnings,
      refundedAmount,
      netEarnings: totalEarnings - refundedAmount,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching doctor earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings',
      error: error.message
    });
  }
};

// @desc    Request refund for cancelled appointment
// @route   POST /api/payments/:paymentId/refund-request
// @access  Patient/Doctor
const requestRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

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

    // Check if already refunded
    if (['refunded', 'refund_requested'].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        message: `Refund already ${payment.status === 'refunded' ? 'processed' : 'requested'}`
      });
    }

    // Only paid payments can be refunded
    if (payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Only paid consultations can be refunded'
      });
    }

    // Update payment status
    payment.status = 'refund_requested';
    payment.refundReason = reason;
    payment.refundRequestedAt = new Date();
    await payment.save();

    console.log(`🔄 Refund requested for payment ${paymentId}`);
    console.log(`   Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully. Admin will review it.',
      data: payment
    });

  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting refund',
      error: error.message
    });
  }
};

// @desc    Confirm clinic payment (Doctor only)
// @route   PUT /api/payments/:paymentId/confirm
// @access  Doctor only
const confirmClinicPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

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

    if (payment.doctor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only confirm payments for your own appointments'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.status}`
      });
    }

    if (payment.paymentMethod !== 'clinic_visit') {
      return res.status(400).json({
        success: false,
        message: 'Only clinic visit payments require confirmation'
      });
    }

    payment.status = 'paid';
    payment.confirmedBy = req.user.id;
    payment.confirmedAt = new Date();
    await payment.save();

    const appointment = await Appointment.findById(payment.appointment);
    if (appointment) {
      appointment.paymentStatus = 'paid';
      await appointment.save();
    }

    console.log(`✅ Clinic payment confirmed by doctor for payment ${paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Clinic payment confirmed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

module.exports = {
  processPayment,
  getPaymentDetails,
  getPaymentByAppointment,
  getPatientPaymentHistory,
  getDoctorEarnings,
  requestRefund,
  confirmClinicPayment
};
