import React from 'react';
import Button from '../common/Button';

const PrescriptionView = ({ prescription, onClose, onEdit, userRole }) => {
  if (!prescription) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const canEdit = userRole === 'doctor' || userRole === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Digital Prescription</h2>
              <p className="text-blue-100">Prescription #{prescription.prescriptionNumber}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(prescription.status)}`}>
                {prescription.status || 'active'}
              </span>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6" id="prescription-content">
          {/* Patient & Doctor Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{prescription.patient?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{prescription.patient?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-gray-900">{prescription.patient?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Doctor Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{prescription.doctor?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Specialization:</span>
                  <span className="ml-2 text-gray-900">{prescription.doctor?.specialization || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-900">{formatDateTime(prescription.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Information */}
          {prescription.appointment && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Appointment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-900">{formatDate(prescription.appointment.appointmentDate)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time:</span>
                  <span className="ml-2 text-gray-900">
                    {prescription.appointment.startTime} - {prescription.appointment.endTime}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-900 capitalize">{prescription.appointment.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnosis</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{prescription.diagnosis || 'No diagnosis provided'}</p>
            </div>
          </div>

          {/* Symptoms */}
          {prescription.symptoms && prescription.symptoms.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {prescription.symptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="inline-flex px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Medicines */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Prescribed Medicines</h3>
            <div className="space-y-4">
              {prescription.medicines?.map((medicine, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Medicine:</span>
                      <p className="text-gray-900 font-semibold">{medicine.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dosage:</span>
                      <p className="text-gray-900">{medicine.dosage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Frequency:</span>
                      <p className="text-gray-900">{medicine.frequency}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>
                      <p className="text-gray-900">{medicine.duration}</p>
                    </div>
                  </div>
                  {medicine.instructions && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="font-medium text-gray-700">Special Instructions:</span>
                      <p className="text-gray-900 mt-1">{medicine.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lab Tests */}
          {prescription.labTests && prescription.labTests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended Lab Tests</h3>
              <div className="flex flex-wrap gap-2">
                {prescription.labTests.map((test, index) => (
                  <span
                    key={index}
                    className="inline-flex px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200"
                  >
                    {test}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* General Instructions */}
          {prescription.instructions && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">General Instructions</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{prescription.instructions}</p>
              </div>
            </div>
          )}

          {/* Follow-up Date */}
          {prescription.followUpDate && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Follow-up Appointment</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-900 font-medium">{formatDate(prescription.followUpDate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Prescription Age */}
          <div className="text-sm text-gray-500 border-t pt-4">
            <p>Prescription issued: {formatDateTime(prescription.createdAt)}</p>
            {prescription.updatedAt && prescription.updatedAt !== prescription.createdAt && (
              <p>Last updated: {formatDateTime(prescription.updatedAt)}</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Prescription #{prescription.prescriptionNumber}
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handlePrint}
              variant="secondary"
              className="flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
            {canEdit && onEdit && (
              <Button
                onClick={() => onEdit(prescription)}
                className="flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .fixed {
            position: relative !important;
          }
          .bg-black {
            background-color: transparent !important;
          }
          .bg-opacity-50 {
            background-color: transparent !important;
          }
          .shadow-xl {
            box-shadow: none !important;
          }
          .max-h-[90vh] {
            max-height: none !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
          }
          .rounded-lg {
            border-radius: 0 !important;
          }
          .p-4 {
            padding: 0 !important;
          }
          .bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .bg-blue-50 {
            background-color: #eff6ff !important;
          }
          .bg-amber-50 {
            background-color: #fffbeb !important;
          }
          .bg-purple-50 {
            background-color: #faf5ff !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionView;