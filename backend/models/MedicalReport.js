const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['lab_test', 'x_ray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'prescription', 'medical_history', 'other'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  // Link to appointment (optional - for Feature 1)
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  // Link to second opinion request (optional - for Feature 2)
  secondOpinionRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecondOpinionRequest',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
medicalReportSchema.index({ patient: 1, uploadDate: -1 });
medicalReportSchema.index({ appointment: 1 });
medicalReportSchema.index({ secondOpinionRequest: 1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
