const mongoose = require('mongoose');

const secondOpinionRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  medicalReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalReport'
  }],
  chiefComplaint: {
    type: String,
    required: true,
    trim: true
  },
  medicalHistory: {
    type: String,
    trim: true
  },
  currentMedications: {
    type: String,
    trim: true
  },
  allergies: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'under_review', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  doctorOpinion: {
    diagnosis: {
      type: String,
      trim: true
    },
    recommendations: {
      type: String,
      trim: true
    },
    prescribedTreatment: {
      type: String,
      trim: true
    },
    additionalNotes: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date
    }
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  assignedDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedResponseTime: {
    type: String,
    default: '24-48 hours'
  },
  notifications: [{
    type: {
      type: String,
      enum: ['submitted', 'assigned', 'under_review', 'completed', 'message']
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
secondOpinionRequestSchema.index({ patient: 1, status: 1 });
secondOpinionRequestSchema.index({ assignedDoctor: 1, status: 1 });
secondOpinionRequestSchema.index({ requestDate: -1 });

// Virtual for request age
secondOpinionRequestSchema.virtual('requestAge').get(function() {
  return Math.floor((Date.now() - this.requestDate) / (1000 * 60 * 60)); // in hours
});

// Avoid OverwriteModelError
const SecondOpinionRequest = mongoose.models.SecondOpinionRequest || mongoose.model('SecondOpinionRequest', secondOpinionRequestSchema);
module.exports = SecondOpinionRequest;
