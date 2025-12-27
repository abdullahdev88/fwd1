const mongoose = require('mongoose');

// Medical Report model for storing uploaded patient reports
const medicalReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },

    reportType: {
      type: String,
      enum: ['lab', 'xray', 'mri', 'prescription', 'other'],
      required: true
    },

    fileUrl: {
      type: String,
      required: true
    },

    originalFileName: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
medicalReportSchema.index({ patient: 1 });
medicalReportSchema.index({ appointment: 1 });

// Avoid OverwriteModelError
const MedicalReport = mongoose.models.MedicalReport || mongoose.model('MedicalReport', medicalReportSchema);
module.exports = MedicalReport;
