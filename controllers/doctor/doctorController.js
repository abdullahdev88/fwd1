const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');
const User = require('../../models/User');

// @desc    Get doctor dashboard data
// @route   GET /api/doctor/dashboard
// @access  Private (Doctor only)
const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's appointments
    const todayAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'scheduled'
    })
    .populate('patient', 'name phone email')
    .sort({ 'timeSlot.startTime': 1 });

    // Get upcoming appointments (next 7 days)
    const upcomingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      status: 'scheduled'
    })
    .populate('patient', 'name phone')
    .sort({ appointmentDate: 1 })
    .limit(10);

    // Get statistics
    const totalPatients = await Appointment.distinct('patient', { doctor: doctorId });
    const completedAppointments = await Appointment.countDocuments({
      doctor: doctorId,
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      data: {
        todayAppointments,
        upcomingAppointments,
        stats: {
          totalPatients: totalPatients.length,
          completedAppointments,
          todayAppointmentsCount: todayAppointments.length
        }
      }
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/doctor/appointments
// @access  Private (Doctor only)
const getDoctorAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = { doctor: req.user.id };
    
    if (status) query.status = status;
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone dateOfBirth gender bloodGroup')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/doctor/appointments/:id
// @access  Private (Doctor only)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status || appointment.status;
    appointment.notes = notes || appointment.notes;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
};

// @desc    Create prescription
// @route   POST /api/doctor/prescriptions
// @access  Private (Doctor only)
const createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medications, advice, followUpDate } = req.body;

    // Verify appointment belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Create prescription
    const prescription = await Prescription.create({
      appointment: appointmentId,
      patient: appointment.patient,
      doctor: req.user.id,
      diagnosis,
      medications,
      advice,
      followUpDate
    });

    // Update appointment with prescription reference
    appointment.prescription = prescription._id;
    appointment.status = 'completed';
    await appointment.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: { prescription: populatedPrescription }
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message
    });
  }
};

// @desc    Update doctor availability
// @route   PUT /api/doctor/availability
// @access  Private (Doctor only)
const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    const doctor = await User.findById(req.user.id);
    doctor.availability = availability;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability: doctor.availability }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
};

module.exports = {
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  createPrescription,
  updateAvailability
};
