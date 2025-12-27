const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Core Payment Information
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    default: 2000 // Demo amount in PKR
  },
  currency: {
    type: String,
    default: 'PKR'
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    required: true,
    enum: [
      'credit_card',
      'debit_card',
      'easypaisa',
      'jazzcash',
      'stripe',
      'paypal',
      'apple_pay',
      'google_pay',
      'bank_transfer',
      'clinic_visit'
    ]
  },
  
  // Payment Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refund_requested', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Transaction Details (Simulated)
  transactionId: {
    type: String,
    unique: true
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  
  // Payment Method Details
  phoneNumber: {
    type: String,
    maxlength: 11
  },
  
  // Refund Information
  refundReason: {
    type: String
  },
  refundRequestedAt: {
    type: Date
  },
  refundProcessedAt: {
    type: Date
  },
  refundProcessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who processed refund
  },
  refundAmount: {
    type: Number
  },
  
  // Clinic Payment Confirmation
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedAt: {
    type: Date
  },
  
  // Invoice Details
  invoiceNumber: {
    type: String,
    unique: true
  },
  invoiceGeneratedAt: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  description: {
    type: String,
    default: 'Online Medical Consultation Fee'
  },
  notes: {
    type: String
  },
  
  // Admin Actions
  adminNotes: {
    type: String
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate unique transaction ID
paymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Generate unique invoice number
paymentSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.invoiceNumber = `INV-${year}${month}-${random}`;
  }
  next();
});

// Index for faster queries
paymentSchema.index({ appointment: 1 });
paymentSchema.index({ patient: 1 });
paymentSchema.index({ doctor: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ invoiceNumber: 1 });

// Avoid OverwriteModelError
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
module.exports = Payment;
