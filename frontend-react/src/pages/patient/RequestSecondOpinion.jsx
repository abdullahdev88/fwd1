import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { secondOpinionAPI } from '../../services/api';
import { appointmentAPI } from '../../services/api';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RequestSecondOpinion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    doctorId: '',
    chiefComplaint: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    priority: 'normal',
    reportType: 'other',
    description: ''
  });

  const [medicalReports, setMedicalReports] = useState([]);

  useEffect(() => {
    fetchAvailableDoctors();
  }, []);

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
    if (files.length > 10) {
      setError('Maximum 10 files allowed');
      return;
    }
    setMedicalReports(files);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.doctorId) {
      setError('Please select a doctor');
      return;
    }
    
    if (medicalReports.length === 0) {
      setError('At least one medical report is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = new FormData();
      
      // Append form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      // Append files
      medicalReports.forEach(file => {
        submitData.append('reports', file);
      });

      await secondOpinionAPI.submitRequest(submitData);

      setSuccess(true);
      setTimeout(() => navigate('/patient/second-opinions'), 2500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit second opinion request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Request Second Opinion</h1>
        <p className="text-gray-600 mb-6">
          Get an expert medical opinion from our qualified doctors. Upload your medical reports and describe your condition.
        </p>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-lg">
            ✅ Second opinion request submitted successfully! Redirecting...
          </div>
        )}

        {doctorsLoading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Selection */}
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                Select Doctor for Second Opinion *
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a doctor...</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization} ({doctor.experience} years exp.)
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                The selected doctor will review your case and provide their medical opinion
              </p>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                Chief Complaint / Main Concern *
              </label>
              <textarea
                name="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={handleInputChange}
                required
                rows="3"
                placeholder="Describe your main medical concern or symptoms..."
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

          {/* Medical History */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Medical History (Optional)
            </label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              rows="3"
              placeholder="Previous diagnoses, surgeries, chronic conditions..."
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Current Medications */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Current Medications (Optional)
            </label>
            <textarea
              name="currentMedications"
              value={formData.currentMedications}
              onChange={handleInputChange}
              rows="2"
              placeholder="List all medications you're currently taking..."
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Allergies */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Known Allergies (Optional)
            </label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleInputChange}
              placeholder="Drug allergies, food allergies, etc..."
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Priority Level *
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="normal">Normal (24-48 hours)</option>
              <option value="urgent">Urgent (12-24 hours)</option>
              <option value="emergency">Emergency (Immediate attention)</option>
            </select>
          </div>

          {/* Medical Reports Upload */}
          <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold text-lg mb-3 text-blue-800">📄 Upload Medical Reports *</h3>
            <p className="text-sm text-gray-700 mb-4">
              Please upload all relevant medical documents including lab results, imaging reports, prescriptions, etc.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Report Type</label>
                <select
                  name="reportType"
                  value={formData.reportType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg"
                >
                  <option value="lab_test">Lab Test Results</option>
                  <option value="x_ray">X-Ray</option>
                  <option value="mri">MRI Scan</option>
                  <option value="ct_scan">CT Scan</option>
                  <option value="ultrasound">Ultrasound</option>
                  <option value="ecg">ECG/EKG</option>
                  <option value="prescription">Previous Prescription</option>
                  <option value="medical_history">Medical History Documents</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Report Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the reports..."
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Select Files (Max 10) *</label>
                <input
                  type="file"
                  multiple
                  required
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Accepted formats: Images, PDF, Word documents (Max 10MB per file)
                </p>
              </div>

              {medicalReports.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="font-semibold mb-2">Selected Files ({medicalReports.length}):</p>
                  <ul className="space-y-1">
                    {medicalReports.map((file, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600">📎</span>
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => navigate('/patient/second-opinions')}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400"
            >
              {loading ? '⏳ Submitting...' : '✅ Submit Request'}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default RequestSecondOpinion;
