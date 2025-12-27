const mongoose = require('mongoose');

// Prescription model for doctor-issued medications
const prescriptionSchema = new mongoose.Schema({
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
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }, // e.g., "3 times a day"
    duration: { type: String, required: true }, // e.g., "7 days"
    instructions: String
  }],
  advice: {
    type: String,
    trim: true
  },
  followUpDate: Date
}, {
  timestamps: true
});

// Avoid OverwriteModelError
const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
