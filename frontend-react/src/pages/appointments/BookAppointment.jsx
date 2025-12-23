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
    <div className="max-w-2xl mx-auto p-6 card">
      <h1 className="text-3xl font-bold mb-6 text-[rgb(var(--text-heading))]">Book Appointment</h1>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
          ✅ Appointment booked successfully! Redirecting to your appointments...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Doctor Selection */}
        <div>
          <label className="label">Select Doctor *</label>
          <select 
            name="doctorId" 
            value={formData.doctorId}
            onChange={handleInputChange} 
            required
            className="input-field">
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
          <label className="label">Appointment Date *</label>
          <input 
            type="date" 
            name="appointmentDate"
            value={formData.appointmentDate}
            min={minDate}
            onChange={handleInputChange}
            className="input-field"
            required />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Time *</label>
            <input 
              type="time" 
              name="startTime"
              value={formData.startTime}
              onChange={handleStartTimeChange}
              className="input-field"
              required />
          </div>
          <div>
            <label className="label">End Time</label>
            <input 
              type="time" 
              value={formData.endTime}
              readOnly 
              className="input-field opacity-75 cursor-not-allowed" />
          </div>
        </div>

        {/* Request Message */}
        <div>
          <label className="label">Message to Doctor (Optional)</label>
          <textarea 
            name="requestMessage"
            value={formData.requestMessage}
            onChange={handleInputChange}
            rows="3"
            placeholder="Brief description of your symptoms or reason for visit..."
            className="input-field" />
        </div>

        {/* Medical Reports Upload (Feature 1) */}
        <div className="bg-[rgb(var(--bg-tertiary))] p-4 rounded-lg border-2 border-[rgb(var(--border-color))]">
          <h3 className="font-semibold text-lg mb-3 text-[rgb(var(--text-heading))] flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Upload Medical Reports (Optional)
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
            Attach previous medical reports, lab results, or relevant documents to help the doctor prepare for your visit.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="label">Report Type</label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-field">
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
              <label className="label">Description</label>
              <input
                type="text"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Brief description of the reports..."
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Select Files (Max 5)</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="input-field"
              />
              <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">Accepted: Images, PDF, Word documents (Max 10MB per file)</p>
            </div>

            {medicalReports.length > 0 && (
              <div className="bg-[rgb(var(--bg-secondary))] p-3 rounded border-2 border-[rgb(var(--border-color))]">
                <p className="font-medium text-sm mb-2 text-[rgb(var(--text-heading))]">Selected files ({medicalReports.length}):</p>
                <ul className="text-sm space-y-1">
                  {medicalReports.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="truncate text-[rgb(var(--text-primary))]">{f.name}</span>
                      <span className="text-[rgb(var(--text-secondary))] text-xs">({(f.size / 1024).toFixed(1)} KB)</span>
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
          className="btn-primary w-full">
          {loading ? 'Booking Appointment...' : 'Book Appointment'}
        </Button>
      </form>
    </div>
  );
};

export default BookAppointment;
