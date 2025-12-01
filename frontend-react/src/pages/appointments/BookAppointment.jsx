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

  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    requestMessage: ''
  });

  // Redirect if not a patient
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateEndTime = (startTime) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Add 1 hour for appointment duration
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    return endDate.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (e) => {
    const startTime = e.target.value;
    const endTime = calculateEndTime(startTime);
    
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await appointmentAPI.bookAppointment(formData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        doctorId: '',
        appointmentDate: '',
        startTime: '',
        endTime: '',
        requestMessage: ''
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/patient/appointments');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
      console.error('Error booking appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'patient') {
    return <LoadingSpinner />;
  }

  if (doctorsLoading) {
    return <LoadingSpinner />;
  }

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600 mt-2">Request an appointment with your preferred doctor</p>
      </div>

      {error && <ErrorMessage message={error} />}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Appointment request sent successfully! The doctor will review your request and notify you of approval.
          Redirecting to your appointments...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Doctor *
          </label>
          <select
            name="doctorId"
            value={formData.doctorId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                Dr. {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Appointment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appointment Date *
          </label>
          <input
            type="date"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleInputChange}
            min={minDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleStartTimeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Duration: 1 hour (automatically calculated)</p>
          </div>
        </div>

        {/* Request Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message to Doctor (Optional)
          </label>
          <textarea
            name="requestMessage"
            value={formData.requestMessage}
            onChange={handleInputChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your symptoms or reason for the appointment..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={() => navigate('/patient/appointments')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            {loading ? 'Sending Request...' : 'Book Appointment'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;