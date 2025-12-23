const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateInvoice, getInvoicePath, invoiceExists } = require('../services/invoiceService');
const Payment = require('../models/Payment');
const path = require('path');
const fs = require('fs');

// @desc    Generate invoice for a payment
// @route   POST /api/invoices/generate/:paymentId
// @access  Patient/Doctor/Admin
router.post('/generate/:paymentId', protect, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('appointment')
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

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

    // Only generate invoice for paid or refunded payments
    if (!['paid', 'refunded'].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice can only be generated for paid or refunded payments'
      });
    }

    // Generate invoice
    const invoicePath = await generateInvoice(payment);

    res.status(200).json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoiceNumber: payment.invoiceNumber,
        invoicePath: `/api/invoices/download/${payment.invoiceNumber}`
      }
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
});

// @desc    Download invoice PDF
// @route   GET /api/invoices/download/:invoiceNumber
// @access  Patient/Doctor/Admin
router.get('/download/:invoiceNumber', protect, async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    // Find payment by invoice number
    const payment = await Payment.findOne({ invoiceNumber })
      .populate('patient', '_id')
      .populate('doctor', '_id');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
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

    const invoicePath = getInvoicePath(invoiceNumber);

    // Check if invoice file exists
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found. Please generate it first.'
      });
    }

    // Send PDF file
    res.download(invoicePath, `Invoice-${invoiceNumber}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading invoice:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading invoice'
        });
      }
    });

  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading invoice',
      error: error.message
    });
  }
});

// @desc    View invoice in browser
// @route   GET /api/invoices/view/:invoiceNumber
// @access  Patient/Doctor/Admin
router.get('/view/:invoiceNumber', protect, async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const payment = await Payment.findOne({ invoiceNumber })
      .populate('patient', '_id')
      .populate('doctor', '_id');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
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

    const invoicePath = getInvoicePath(invoiceNumber);

    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found'
      });
    }

    // Set headers for PDF viewing in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${invoiceNumber}.pdf`);

    // Stream the PDF
    const fileStream = fs.createReadStream(invoicePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error viewing invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error viewing invoice',
      error: error.message
    });
  }
});

module.exports = router;
