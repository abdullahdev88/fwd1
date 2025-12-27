const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const availabilitySlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    startTime: {
      type: String,
      required: true // Format: "09:00"
    },
    endTime: {
      type: String,
      required: true // Format: "10:00"
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }]
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  // Doctor-specific fields
  specialization: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  experience: {
    type: Number,
    required: function() { return this.role === 'doctor'; }
  },
  education: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  pmdcId: {
    type: String,
    required: function() { return this.role === 'doctor'; },
    unique: true,
    sparse: true
  },
  // Doctor approval system
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      return this.role === 'doctor' ? 'pending' : 'approved';
    }
  },
  // Doctor availability
  availability: [availabilitySlotSchema],
  
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
