const MedicalReport = require('../../models/MedicalReport');
const Appointment = require('../../models/Appointment');

const uploadMedicalReports = async (req, res) => {
  try {
    const { appointmentId, doctorId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const reports = req.files.map((file) => ({
      patient: req.user.id,
      doctor: doctorId,
      appointment: appointmentId,
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path
    }));

    await MedicalReport.insertMany(reports);

    res.status(201).json({
      success: true,
      message: 'Medical reports uploaded successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload medical reports'
    });
  }
};

module.exports = { uploadMedicalReports };
