import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { medicalRecordsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';

const CreateMedicalRecord = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [formData, setFormData] = useState({
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    notes: '',
    treatmentPlan: '',
    prescription: '',
    vitalSigns: {
      bloodPressure: { systolic: '', diastolic: '' },
      temperature: '',
      heartRate: '',
      weight: '',
      height: ''
    },
    labResults: '',
    followUpDate: ''
  });

  // Redirect if not a doctor
  useEffect(() => {
    if (user && user.role !== 'doctor') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Load doctor's appointments on component mount
  useEffect(() => {
    if (user && user.role === 'doctor') {
      loadDoctorAppointments();
    }
  }, [user]);
  
  // Load doctor's appointments
  const loadDoctorAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const response = await medicalRecordsAPI.getDoctorAppointments();
      setAppointments(response.data.data || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  // Search for patients
  const handlePatientSearch = async (query) => {
    setPatientSearchQuery(query);
    
    if (query.length < 2) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      return;
    }
    
    setSearchingPatients(true);
    try {
      const response = await medicalRecordsAPI.searchPatients(query);
      setPatientSearchResults(response.data.data || []);
      setShowPatientDropdown(true);
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatientSearchResults([]);
    } finally {
      setSearchingPatients(false);
    }
  };
  
  // Select a patient from search results
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearchQuery(patient.name);
    setShowPatientDropdown(false);
    setPatientSearchResults([]);
  };
  
  // Handle appointment selection
  const handleAppointmentSelect = (appointmentId) => {
    const appointment = appointments.find(a => a._id === appointmentId);
    if (appointment && appointment.patient) {
      setSelectedPatient(appointment.patient);
      setPatientSearchQuery(appointment.patient.name);
      setFormData(prev => ({
        ...prev,
        appointmentId: appointmentId
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      if (subChild) {
        // Handle nested vital signs
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        // Handle single level nesting
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Validate patient selection
    if (!selectedPatient && !formData.appointmentId) {
      setError('Please select a patient or appointment');
      setLoading(false);
      return;
    }

    try {
      // Clean up vital signs data
      const cleanedVitalSigns = {};
      if (formData.vitalSigns.bloodPressure.systolic || formData.vitalSigns.bloodPressure.diastolic) {
        cleanedVitalSigns.bloodPressure = {
          systolic: parseFloat(formData.vitalSigns.bloodPressure.systolic) || undefined,
          diastolic: parseFloat(formData.vitalSigns.bloodPressure.diastolic) || undefined
        };
      }
      if (formData.vitalSigns.temperature) cleanedVitalSigns.temperature = parseFloat(formData.vitalSigns.temperature);
      if (formData.vitalSigns.heartRate) cleanedVitalSigns.heartRate = parseFloat(formData.vitalSigns.heartRate);
      if (formData.vitalSigns.weight) cleanedVitalSigns.weight = parseFloat(formData.vitalSigns.weight);
      if (formData.vitalSigns.height) cleanedVitalSigns.height = parseFloat(formData.vitalSigns.height);

      const submitData = {
        ...formData,
        // Use patientEmail to identify patient (backend will handle mapping to _id)
        patientEmail: selectedPatient?.email,
        vitalSigns: cleanedVitalSigns,
        appointmentId: formData.appointmentId || undefined,
        followUpDate: formData.followUpDate || undefined
      };

      await medicalRecordsAPI.createRecord(submitData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        appointmentId: '',
        diagnosis: '',
        symptoms: '',
        notes: '',
        treatmentPlan: '',
        prescription: '',
        vitalSigns: {
          bloodPressure: { systolic: '', diastolic: '' },
          temperature: '',
          heartRate: '',
          weight: '',
          height: ''
        },
        labResults: '',
        followUpDate: ''
      });
      setSelectedPatient(null);
      setPatientSearchQuery('');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/doctor/medical-records');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create medical record');
      console.error('Error creating medical record:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'doctor') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">Create Medical Record</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-2">Create a new medical record for your patient</p>
        </div>

      {error && <ErrorMessage message={error} />}
      
      {success && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
          Medical record created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Appointment Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Appointment Selection */}
            <div className="md:col-span-2">
              <label className="label">
                Select from Your Appointments (Recommended)
              </label>
              <select
                name="appointmentId"
                value={formData.appointmentId}
                onChange={(e) => handleAppointmentSelect(e.target.value)}
                className="input-field"
              >
                <option value="">-- Select an appointment --</option>
                {loadingAppointments ? (
                  <option>Loading appointments...</option>
                ) : (
                  appointments.map(apt => (
                    <option key={apt._id} value={apt._id}>
                      {apt.patient?.name} - {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.startTime}
                    </option>
                  ))
                )}
              </select>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                Selecting an appointment automatically fills the patient information
              </p>
            </div>
            
            {/* Patient Search */}
            <div className="md:col-span-2">
              <label className="label">
                Or Search Patient by Name, Email, or Phone *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  onFocus={() => patientSearchResults.length > 0 && setShowPatientDropdown(true)}
                  className="input-field"
                  placeholder="Type to search for a patient..."
                  disabled={!!formData.appointmentId}
                />
                
                {searchingPatients && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
                
                {/* Search Results Dropdown */}
                {showPatientDropdown && patientSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {patientSearchResults.map(patient => (
                      <button
                        key={patient._id}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full text-left px-4 py-3 hover:bg-[rgb(var(--bg-tertiary))] border-b border-[rgb(var(--border))] last:border-b-0"
                      >
                        <div className="font-medium text-[rgb(var(--text-heading))]">{patient.name}</div>
                        <div className="text-sm text-[rgb(var(--text-secondary))]">{patient.email}</div>
                        {patient.phone && (
                          <div className="text-sm text-[rgb(var(--text-secondary))]">{patient.phone}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected Patient Display */}
              {selectedPatient && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-emerald-400">Selected Patient:</p>
                      <p className="text-[rgb(var(--text-primary))]">{selectedPatient.name}</p>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">{selectedPatient.email}</p>
                      {selectedPatient.phone && (
                        <p className="text-sm text-[rgb(var(--text-secondary))]">{selectedPatient.phone}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearchQuery('');
                        setFormData(prev => ({ ...prev, appointmentId: '' }));
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Medical Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">
                Diagnosis *
              </label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Patient's diagnosis"
                required
              />
            </div>
            
            <div>
              <label className="label">
                Symptoms *
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows="3"
                className="input-field"
                placeholder="Describe the patient's symptoms"
                required
              />
            </div>
            
            <div>
              <label className="label">
                Treatment Plan *
              </label>
              <textarea
                name="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={handleInputChange}
                rows="3"
                className="input-field"
                placeholder="Detailed treatment plan"
                required
              />
            </div>
            
            <div>
              <label className="label">
                Prescription
              </label>
              <textarea
                name="prescription"
                value={formData.prescription}
                onChange={handleInputChange}
                rows="3"
                className="input-field"
                placeholder="Medications and dosage"
              />
            </div>
            
            <div>
              <label className="label">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="input-field"
                placeholder="Additional notes"
              />
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="card">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Vital Signs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">
                Blood Pressure (Systolic)
              </label>
              <input
                type="number"
                name="vitalSigns.bloodPressure.systolic"
                value={formData.vitalSigns.bloodPressure.systolic}
                onChange={handleInputChange}
                className="input-field"
                placeholder="120"
              />
            </div>
            
            <div>
              <label className="label">
                Blood Pressure (Diastolic)
              </label>
              <input
                type="number"
                name="vitalSigns.bloodPressure.diastolic"
                value={formData.vitalSigns.bloodPressure.diastolic}
                onChange={handleInputChange}
                className="input-field"
                placeholder="80"
              />
            </div>
            
            <div>
              <label className="label">
                Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                name="vitalSigns.temperature"
                value={formData.vitalSigns.temperature}
                onChange={handleInputChange}
                className="input-field"
                placeholder="98.6"
              />
            </div>
            
            <div>
              <label className="label">
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                name="vitalSigns.heartRate"
                value={formData.vitalSigns.heartRate}
                onChange={handleInputChange}
                className="input-field"
                placeholder="72"
              />
            </div>
            
            <div>
              <label className="label">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                name="vitalSigns.weight"
                value={formData.vitalSigns.weight}
                onChange={handleInputChange}
                className="input-field"
                placeholder="150"
              />
            </div>
            
            <div>
              <label className="label">
                Height (inches)
              </label>
              <input
                type="number"
                step="0.1"
                name="vitalSigns.height"
                value={formData.vitalSigns.height}
                onChange={handleInputChange}
                className="input-field"
                placeholder="68"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">
                Lab Results
              </label>
              <textarea
                name="labResults"
                value={formData.labResults}
                onChange={handleInputChange}
                rows="3"
                className="input-field"
                placeholder="Lab test results and interpretations"
              />
            </div>
            
            <div>
              <label className="label">
                Follow-up Date
              </label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2"
          >
            {loading ? 'Creating...' : 'Create Medical Record'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default CreateMedicalRecord;