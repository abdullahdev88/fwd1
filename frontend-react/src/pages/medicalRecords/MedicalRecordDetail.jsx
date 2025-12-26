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
      active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800',
      completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
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
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Record Details</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Created on {new Date(record.createdAt).toLocaleDateString()} at{' '}
                {new Date(record.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(record.status)}
              
              {user.role === 'doctor' && (
                <Link
                  to={`/medical-records/${record._id}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Edit Record
                </Link>
              )}
              
              {user.role === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Patient Information</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                  {record.patient?.name?.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-white">{record.patient?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{record.patient?.email}</p>
                {record.patient?.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{record.patient.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-100 dark:border-green-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Doctor Information</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <span className="text-sm font-medium text-green-600 dark:text-green-300">Dr</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-white">{record.doctor?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{record.doctor?.specialization}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Medical Information</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Diagnosis</h3>
              <p className="text-gray-900 dark:text-gray-100 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-800">{record.diagnosis}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
              <div className="flex items-center">
                {getStatusBadge(record.status)}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Symptoms</h3>
            <p className="text-gray-900 dark:text-gray-100 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-md whitespace-pre-wrap border border-orange-100 dark:border-orange-800">
              {record.symptoms}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Treatment Plan</h3>
            <p className="text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md whitespace-pre-wrap border border-blue-100 dark:border-blue-800">
              {record.treatmentPlan}
            </p>
          </div>

          {record.prescription && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Prescription</h3>
              <p className="text-gray-900 dark:text-gray-100 bg-green-50 dark:bg-green-900/20 p-4 rounded-md whitespace-pre-wrap border border-green-100 dark:border-green-800">
                {record.prescription}
              </p>
            </div>
          )}

          {record.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Additional Notes</h3>
              <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap border border-gray-200 dark:border-gray-600">
                {record.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vital Signs */}
      {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vital Signs</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-900 dark:text-gray-100 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-100 dark:border-yellow-800">
              {formatVitalSigns(record.vitalSigns)}
            </p>
          </div>
        </div>
      )}

      {/* Lab Results */}
      {record.labResults && (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lab Results</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-900 dark:text-gray-100 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md whitespace-pre-wrap border border-purple-100 dark:border-purple-800">
              {record.labResults}
            </p>
          </div>
        </div>
      )}

      {/* Follow-up & Appointment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {record.appointment && (
          <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Related Appointment</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-900 dark:text-gray-100">
                Date: {new Date(record.appointment.appointmentDate).toLocaleDateString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Time: {record.appointment.startTime}</p>
            </div>
          </div>
        )}

        {record.followUpDate && (
          <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Follow-up Date</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-900 dark:text-gray-100 font-medium">
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
          className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default MedicalRecordDetail;