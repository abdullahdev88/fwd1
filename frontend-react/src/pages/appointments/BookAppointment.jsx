import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [reportType, setReportType] = useState('other');
  const [reportDescription, setReportDescription] = useState('');

  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    requestMessage: ''
  });

  useEffect(() => {
    if (user && user.role !== 'patient') {
      navigate('/');
    } else if (user && user.role === 'patient') {
      fetchAvailableDoctors();
    }
  }, [user, navigate]);

  const fetchAvailableDoctors = async () => {
    try {
      const response = await appointmentAPI.getAvailableDoctors();
      setDoctors(response.data.data);
    } catch (err) {
      setError('Failed to fetch available doctors');
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }
    setMedicalReports(files);
  };

  const calculateEndTime = (startTime) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    return endDate.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (e) => {
    const startTime = e.target.value;
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime: calculateEndTime(startTime)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Book the appointment
      const appointmentResponse = await appointmentAPI.bookAppointment(formData);
      const appointmentId = appointmentResponse.data.data._id;

      // Step 2: Upload medical reports if any (Feature 1)
      if (medicalReports.length > 0) {
        const uploadData = new FormData();
        medicalReports.forEach(file => {
          uploadData.append('reports', file);
        });
        uploadData.append('reportType', reportType);
        uploadData.append('description', reportDescription);

        await appointmentAPI.uploadMedicalReports(appointmentId, uploadData);
      }

      setSuccess(true);
      setMedicalReports([]);
      setFormData({
        doctorId: '',
        appointmentDate: '',
        startTime: '',
        endTime: '',
        requestMessage: ''
      });

      setTimeout(() => navigate('/patient/appointments'), 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'patient') return <LoadingSpinner />;
  if (doctorsLoading) return <LoadingSpinner />;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Book Appointment</h1>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-lg">
          ✅ Appointment booked successfully! Redirecting to your appointments...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Doctor Selection */}
        <div>
          <label className="block font-medium mb-2 text-gray-700">Select Doctor *</label>
          <select 
            name="doctorId" 
            value={formData.doctorId}
            onChange={handleInputChange} 
            required
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Choose a doctor...</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>
                Dr. {d.name} - {d.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Appointment Date */}
        <div>
          <label className="block font-medium mb-2 text-gray-700">Appointment Date *</label>
          <input 
            type="date" 
            name="appointmentDate"
            value={formData.appointmentDate}
            min={minDate}
            onChange={handleInputChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2 text-gray-700">Start Time *</label>
            <input 
              type="time" 
              name="startTime"
              value={formData.startTime}
              onChange={handleStartTimeChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required />
          </div>
          <div>
            <label className="block font-medium mb-2 text-gray-700">End Time</label>
            <input 
              type="time" 
              value={formData.endTime}
              readOnly 
              className="w-full border border-gray-300 px-4 py-2 bg-gray-100 rounded-lg cursor-not-allowed" />
          </div>
        </div>

        {/* Request Message */}
        <div>
          <label className="block font-medium mb-2 text-gray-700">Message to Doctor (Optional)</label>
          <textarea 
            name="requestMessage"
            value={formData.requestMessage}
            onChange={handleInputChange}
            rows="3"
            placeholder="Brief description of your symptoms or reason for visit..."
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Medical Reports Upload (Feature 1) */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-lg mb-3 text-blue-800">📄 Upload Medical Reports (Optional)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Attach previous medical reports, lab results, or relevant documents to help the doctor prepare for your visit.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block font-medium mb-2 text-gray-700">Report Type</label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="lab_test">Lab Test</option>
                <option value="x_ray">X-Ray</option>
                <option value="mri">MRI</option>
                <option value="ct_scan">CT Scan</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="ecg">ECG</option>
                <option value="prescription">Previous Prescription</option>
                <option value="medical_history">Medical History</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2 text-gray-700">Description</label>
              <input
                type="text"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Brief description of the reports..."
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium mb-2 text-gray-700">Select Files (Max 5)</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Accepted: Images, PDF, Word documents (Max 10MB per file)</p>
            </div>

            {medicalReports.length > 0 && (
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="font-medium text-sm mb-2">Selected files ({medicalReports.length}):</p>
                <ul className="text-sm space-y-1">
                  {medicalReports.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-blue-600">📎</span>
                      <span className="truncate">{f.name}</span>
                      <span className="text-gray-500 text-xs">({(f.size / 1024).toFixed(1)} KB)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400">
          {loading ? '⏳ Booking Appointment...' : '✅ Book Appointment'}
        </Button>
      </form>
    </div>
  );
};

export default BookAppointment;
