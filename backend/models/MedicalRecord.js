const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null // Optional but recommended
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms are required'],
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  treatmentPlan: {
    type: String,
    required: [true, 'Treatment plan is required'],
    trim: true
  },
  prescription: {
    type: String,
    trim: true,
    default: ''
  },
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    temperature: Number,
    heartRate: Number,
    weight: Number,
    height: Number
  },
  labResults: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for better query performance
medicalRecordSchema.index({ patient: 1, doctor: 1 });
medicalRecordSchema.index({ createdAt: -1 });

// Virtual for formatted creation date
medicalRecordSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to get record summary
medicalRecordSchema.methods.getSummary = function() {
  return {
    id: this._id,
    patient: this.patient,
    doctor: this.doctor,
    diagnosis: this.diagnosis,
    createdAt: this.createdAt,
    status: this.status
  };
};

// Static method to find records by patient
medicalRecordSchema.statics.findByPatient = function(patientId) {
  return this.find({ patient: patientId })
    .populate('doctor', 'name specialization')
    .populate('appointment', 'appointmentDate startTime')
    .sort({ createdAt: -1 });
};

// Static method to find records by doctor
medicalRecordSchema.statics.findByDoctor = function(doctorId) {
  return this.find({ doctor: doctorId })
    .populate('patient', 'name email phone')
    .populate('appointment', 'appointmentDate startTime')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);