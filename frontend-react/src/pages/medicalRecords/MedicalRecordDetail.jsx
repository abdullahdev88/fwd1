import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { medicalRecordsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const MedicalRecordDetail = () => {
  const { id: recordId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecord();
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      const response = await medicalRecordsAPI.getRecordById(recordId);
      setRecord(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch medical record');
      console.error('Error fetching medical record:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      return;
    }

    try {
      await medicalRecordsAPI.deleteRecord(recordId);
      navigate('/medical-records');
    } catch (err) {
      alert('Error deleting record: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatVitalSigns = (vitalSigns) => {
    if (!vitalSigns || Object.keys(vitalSigns).length === 0) {
      return 'No vital signs recorded';
    }

    const signs = [];
    if (vitalSigns.bloodPressure?.systolic && vitalSigns.bloodPressure?.diastolic) {
      signs.push(`BP: ${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic} mmHg`);
    }
    if (vitalSigns.temperature) signs.push(`Temp: ${vitalSigns.temperature}°F`);
    if (vitalSigns.heartRate) signs.push(`HR: ${vitalSigns.heartRate} BPM`);
    if (vitalSigns.weight) signs.push(`Weight: ${vitalSigns.weight} lbs`);
    if (vitalSigns.height) signs.push(`Height: ${vitalSigns.height} in`);

    return signs.length > 0 ? signs.join(' | ') : 'No vital signs recorded';
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!record) return <div>Record not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Medical Record Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created on {new Date(record.createdAt).toLocaleDateString()} at{' '}
                {new Date(record.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(record.status)}
              
              {user.role === 'doctor' && (
                <Link
                  to={`/medical-records/${record._id}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Edit Record
                </Link>
              )}
              
              {user.role === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient & Doctor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {record.patient?.name?.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{record.patient?.name}</p>
                <p className="text-sm text-gray-500">{record.patient?.email}</p>
                {record.patient?.phone && (
                  <p className="text-sm text-gray-500">{record.patient.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor Information</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-sm font-medium text-green-600">Dr</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{record.doctor?.name}</p>
                <p className="text-sm text-gray-500">{record.doctor?.specialization}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Medical Information</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Diagnosis</h3>
              <p className="text-gray-900 bg-red-50 p-3 rounded-md">{record.diagnosis}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <div className="flex items-center">
                {getStatusBadge(record.status)}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Symptoms</h3>
            <p className="text-gray-900 bg-orange-50 p-4 rounded-md whitespace-pre-wrap">
              {record.symptoms}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Treatment Plan</h3>
            <p className="text-gray-900 bg-blue-50 p-4 rounded-md whitespace-pre-wrap">
              {record.treatmentPlan}
            </p>
          </div>

          {record.prescription && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Prescription</h3>
              <p className="text-gray-900 bg-green-50 p-4 rounded-md whitespace-pre-wrap">
                {record.prescription}
              </p>
            </div>
          )}

          {record.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h3>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {record.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vital Signs */}
      {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vital Signs</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-900 bg-yellow-50 p-4 rounded-md">
              {formatVitalSigns(record.vitalSigns)}
            </p>
          </div>
        </div>
      )}

      {/* Lab Results */}
      {record.labResults && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lab Results</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-900 bg-purple-50 p-4 rounded-md whitespace-pre-wrap">
              {record.labResults}
            </p>
          </div>
        </div>
      )}

      {/* Follow-up & Appointment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {record.appointment && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Related Appointment</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-900">
                Date: {new Date(record.appointment.appointmentDate).toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-sm">Time: {record.appointment.startTime}</p>
            </div>
          </div>
        )}

        {record.followUpDate && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Follow-up Date</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-900 font-medium">
                {new Date(record.followUpDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default MedicalRecordDetail;