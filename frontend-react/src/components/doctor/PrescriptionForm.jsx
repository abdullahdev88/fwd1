import React, { useState, useEffect } from 'react';
import { prescriptionAPI, appointmentAPI } from '../../services/api';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const PrescriptionForm = ({ appointmentId, patientId, onSuccess, onCancel, editMode = false, existingPrescription = null }) => {
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    appointmentId: appointmentId || '',
    diagnosis: '',
    symptoms: [],
    medicines: [{ 
      name: '', 
      dosage: '', 
      frequency: '', 
      duration: '', 
      instructions: '' 
    }],
    labTests: [],
    instructions: '',
    followUpDate: ''
  });
  const [symptomInput, setSymptomInput] = useState('');
  const [labTestInput, setLabTestInput] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAppointments, setFetchingAppointments] = useState(false);
  const [error, setError] = useState('');

  // Load existing prescription data in edit mode
  useEffect(() => {
    if (editMode && existingPrescription) {
      setFormData({
        patientId: existingPrescription.patient._id || existingPrescription.patient,
        appointmentId: existingPrescription.appointment._id || existingPrescription.appointment,
        diagnosis: existingPrescription.diagnosis || '',
        symptoms: existingPrescription.symptoms || [],
        medicines: existingPrescription.medicines?.length > 0 ? existingPrescription.medicines : [{ 
          name: '', 
          dosage: '', 
          frequency: '', 
          duration: '', 
          instructions: '' 
        }],
        labTests: existingPrescription.labTests || [],
        instructions: existingPrescription.instructions || '',
        followUpDate: existingPrescription.followUpDate ? 
          new Date(existingPrescription.followUpDate).toISOString().split('T')[0] : ''
      });
    }
  }, [editMode, existingPrescription]);

  // Fetch doctor's appointments for selection (only if not pre-selected)
  useEffect(() => {
    if (!appointmentId) {
      fetchDoctorAppointments();
    }
  }, [appointmentId]);

  const fetchDoctorAppointments = async () => {
    setFetchingAppointments(true);
    try {
      const response = await appointmentAPI.getDoctorAppointments();
      // Filter for approved appointments without prescriptions
      const appointmentsData = response.data.data || response.data;
      const approvedAppointments = appointmentsData.filter(apt => 
        apt.status === 'approved' && !apt.hasPrescription
      );
      setAppointments(approvedAppointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setFetchingAppointments(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicineChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.map((medicine, i) => 
        i === index ? { ...medicine, [field]: value } : medicine
      )
    }));
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { 
        name: '', 
        dosage: '', 
        frequency: '', 
        duration: '', 
        instructions: '' 
      }]
    }));
  };

  const removeMedicine = (index) => {
    if (formData.medicines.length > 1) {
      setFormData(prev => ({
        ...prev,
        medicines: prev.medicines.filter((_, i) => i !== index)
      }));
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !formData.symptoms.includes(symptomInput.trim())) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const addLabTest = () => {
    if (labTestInput.trim() && !formData.labTests.includes(labTestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        labTests: [...prev.labTests, labTestInput.trim()]
      }));
      setLabTestInput('');
    }
  };

  const removeLabTest = (test) => {
    setFormData(prev => ({
      ...prev,
      labTests: prev.labTests.filter(t => t !== test)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.patientId || !formData.appointmentId || !formData.diagnosis || 
        formData.medicines.length === 0 || !formData.medicines[0].name) {
      setError('Please fill in all required fields: Patient, Appointment, Diagnosis, and at least one Medicine.');
      setLoading(false);
      return;
    }

    // Validate medicines
    for (const medicine of formData.medicines) {
      if (!medicine.name || !medicine.dosage || !medicine.frequency || !medicine.duration) {
        setError('Please complete all medicine details (name, dosage, frequency, duration).');
        setLoading(false);
        return;
      }
    }

    try {
      const prescriptionData = {
        ...formData,
        symptoms: formData.symptoms,
        labTests: formData.labTests,
        followUpDate: formData.followUpDate || null
      };

      if (editMode) {
        await prescriptionAPI.updatePrescription(existingPrescription._id, prescriptionData);
      } else {
        await prescriptionAPI.createPrescription(prescriptionData);
      }

      onSuccess?.(editMode ? 'Prescription updated successfully!' : 'Prescription created successfully!');
    } catch (error) {
      console.error('Prescription operation error:', error);
      setError(error.response?.data?.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingAppointments) {
    return <LoadingSpinner message="Loading appointments..." />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[rgb(var(--text-heading))]">
          {editMode ? 'Edit Prescription' : 'Create New Prescription'}
        </h2>
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            className="px-4 py-2"
          >
            Cancel
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appointment Selection */}
        {!appointmentId && (
          <div>
            <label className="label">
              Select Appointment *
            </label>
            <select
              name="appointmentId"
              value={formData.appointmentId}
              onChange={(e) => {
                const selectedAppointment = appointments.find(apt => apt._id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  appointmentId: e.target.value,
                  patientId: selectedAppointment?.patient._id || ''
                }));
              }}
              required
              className="input-field"
            >
              <option value="">Select an appointment</option>
              {appointments.map(appointment => (
                <option key={appointment._id} value={appointment._id}>
                  {appointment.patient.name} - {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Diagnosis */}
        <div>
          <label className="label">
            Diagnosis *
          </label>
          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleInputChange}
            required
            rows={3}
            className="input-field"
            placeholder="Enter diagnosis..."
          />
        </div>

        {/* Symptoms */}
        <div>
          <label className="label">
            Symptoms
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
              className="flex-1 input-field"
              placeholder="Add a symptom..."
            />
            <Button type="button" onClick={addSymptom} variant="secondary">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.symptoms.map((symptom, index) => (
              <span
                key={index}
                className="badge-info"
              >
                {symptom}
                <button
                  type="button"
                  onClick={() => removeSymptom(symptom)}
                  className="ml-2 hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Medicines */}
        <div>
          <label className="label">
            Medicines *
          </label>
          {formData.medicines.map((medicine, index) => (
            <div key={index} className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-color))] rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-[rgb(var(--text-heading))]">Medicine {index + 1}</h4>
                {formData.medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Medicine name *"
                  value={medicine.name}
                  onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                  required
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 500mg) *"
                  value={medicine.dosage}
                  onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                  required
                  className="input-field"
                />
                <select
                  value={medicine.frequency}
                  onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                  required
                  className="input-field"
                >
                  <option value="">Select frequency *</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="Every 4 hours">Every 4 hours</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="As needed">As needed</option>
                  <option value="Before meals">Before meals</option>
                  <option value="After meals">After meals</option>
                  <option value="With meals">With meals</option>
                  <option value="At bedtime">At bedtime</option>
                  <option value="Custom">Custom</option>
                </select>
                <input
                  type="text"
                  placeholder="Duration (e.g., 7 days) *"
                  value={medicine.duration}
                  onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <textarea
                placeholder="Special instructions (optional)"
                value={medicine.instructions}
                onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                rows={2}
                className="w-full mt-4 input-field"
              />
            </div>
          ))}
          <Button type="button" onClick={addMedicine} variant="secondary" className="w-full">
            + Add Another Medicine
          </Button>
        </div>

        {/* Lab Tests */}
        <div>
          <label className="label">
            Recommended Lab Tests
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={labTestInput}
              onChange={(e) => setLabTestInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabTest())}
              className="flex-1 input-field"
              placeholder="Add a lab test..."
            />
            <Button type="button" onClick={addLabTest} variant="secondary">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.labTests.map((test, index) => (
              <span
                key={index}
                className="badge-success"
              >
                {test}
                <button
                  type="button"
                  onClick={() => removeLabTest(test)}
                  className="ml-2 hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* General Instructions */}
        <div>
          <label className="label">
            General Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows={3}
            className="input-field"
            placeholder="Additional instructions for the patient..."
          />
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="label">
            Follow-up Date (Optional)
          </label>
          <input
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            className="input-field"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="px-8"
          >
            {loading ? <LoadingSpinner size="sm" /> : (editMode ? 'Update Prescription' : 'Create Prescription')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;