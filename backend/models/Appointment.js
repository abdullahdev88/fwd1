const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    default: '',
    trim: true
  },
  rejectionReason: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  approvedAt: {
    type: Date
  },
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'not_required'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  consultationFee: {
    type: Number,
    default: 2000,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Medical reports attached to this appointment (Feature 1)
  medicalReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalReport'
  }],
  hasMedicalReports: {
    type: Boolean,
    default: false
  },
  // Appointment reminder tracking (Feature 2)
  reminders: {
    twentyFourHours: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      patientSent: { type: Boolean, default: false },
      doctorSent: { type: Boolean, default: false }
    },
    twoHours: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      patientSent: { type: Boolean, default: false },
      doctorSent: { type: Boolean, default: false }
    },
    fifteenMinutes: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      patientSent: { type: Boolean, default: false },
      doctorSent: { type: Boolean, default: false }
    }
  }
});

// Index for appointment queries
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
