const mongoose = require('mongoose');

// Medicine sub-schema for prescriptions
const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true,
    enum: {
      values: [
        'Once daily',
        'Twice daily', 
        'Three times daily',
        'Four times daily',
        'Every 4 hours',
        'Every 6 hours',
        'Every 8 hours',
        'Every 12 hours',
        'As needed',
        'Before meals',
        'After meals',
        'With meals',
        'At bedtime',
        'Custom'
      ],
      message: 'Please select a valid frequency'
    }
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: true });

// Main prescription schema
const prescriptionSchema = new mongoose.Schema({
  // Required relationships
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required'],
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required'],
    index: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required'],
    index: true
  },
  
  // Medical information
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  symptoms: [{
    type: String,
    trim: true,
    maxlength: [200, 'Each symptom cannot exceed 200 characters']
  }],
  
  // Medicines array
  medicines: {
    type: [medicineSchema],
    validate: {
      validator: function(medicines) {
        return medicines && medicines.length > 0;
      },
      message: 'At least one medicine is required'
    }
  },
  
  // Lab tests and instructions
  labTests: [{
    type: String,
    trim: true,
    maxlength: [200, 'Each lab test cannot exceed 200 characters']
  }],
  instructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Instructions cannot exceed 1000 characters'],
    default: ''
  },
  
  // Follow-up information
  followUpDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Follow-up date must be in the future'
    }
  },
  
  // Prescription status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  
  // Additional metadata
  prescriptionNumber: {
    type: String,
    unique: true,
    index: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ appointment: 1 });
prescriptionSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    this.prescriptionNumber = `RX-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for prescription age
prescriptionSchema.virtual('prescriptionAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Instance methods
prescriptionSchema.methods.isEditableBy = function(userId, userRole) {
  // Only the doctor who created the prescription can edit it
  if (userRole === 'doctor') {
    return this.doctor.toString() === userId.toString();
  }
  // Admins can edit any prescription (optional feature)
  if (userRole === 'admin') {
    return true;
  }
  return false;
};

prescriptionSchema.methods.isViewableBy = function(userId, userRole) {
  // Patient can view their own prescriptions
  if (userRole === 'patient') {
    return this.patient.toString() === userId.toString();
  }
  // Doctor can view prescriptions they created
  if (userRole === 'doctor') {
    return this.doctor.toString() === userId.toString();
  }
  // Admin can view all prescriptions
  if (userRole === 'admin') {
    return true;
  }
  return false;
};

// Static methods for common queries
prescriptionSchema.statics.findByPatient = function(patientId, options = {}) {
  return this.find({ patient: patientId, ...options })
    .populate('doctor', 'name specialization')
    .populate('appointment', 'appointmentDate startTime endTime status')
    .sort({ createdAt: -1 });
};

prescriptionSchema.statics.findByDoctor = function(doctorId, options = {}) {
  return this.find({ doctor: doctorId, ...options })
    .populate('patient', 'name email phone')
    .populate('appointment', 'appointmentDate startTime endTime status')
    .sort({ createdAt: -1 });
};

prescriptionSchema.statics.findByAppointment = function(appointmentId) {
  return this.findOne({ appointment: appointmentId })
    .populate('patient', 'name email phone')
    .populate('doctor', 'name specialization')
    .populate('appointment', 'appointmentDate startTime endTime status');
};

// Validation middleware
prescriptionSchema.pre('validate', async function(next) {
  try {
    // Validate that patient exists and has patient role
    if (this.isNew || this.isModified('patient')) {
      const User = mongoose.model('User');
      const patient = await User.findById(this.patient);
      if (!patient || patient.role !== 'patient') {
        return next(new Error('Invalid patient ID'));
      }
    }
    
    // Validate that doctor exists and has doctor role
    if (this.isNew || this.isModified('doctor')) {
      const User = mongoose.model('User');
      const doctor = await User.findById(this.doctor);
      if (!doctor || doctor.role !== 'doctor') {
        return next(new Error('Invalid doctor ID'));
      }
    }
    
    // Validate that appointment exists and belongs to the doctor and patient
    if (this.isNew || this.isModified('appointment')) {
      const Appointment = mongoose.model('Appointment');
      const appointment = await Appointment.findById(this.appointment);
      if (!appointment) {
        return next(new Error('Invalid appointment ID'));
      }
      if (appointment.patient.toString() !== this.patient.toString() ||
          appointment.doctor.toString() !== this.doctor.toString()) {
        return next(new Error('Appointment does not belong to the specified patient and doctor'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Avoid OverwriteModelError
const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;