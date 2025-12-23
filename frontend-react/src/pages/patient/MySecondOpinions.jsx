import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { secondOpinionAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';

const MySecondOpinions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const response = await secondOpinionAPI.getMyRequests();
      setRequests(response.data.data);
    } catch (err) {
      setError('Failed to fetch second opinion requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      await secondOpinionAPI.cancelRequest(requestId);
      fetchMyRequests();
      setSelectedRequest(null);
    } catch (err) {
      setError('Failed to cancel request');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      under_review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      normal: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-700',
      emergency: 'bg-red-100 text-red-700'
    };
    return badges[priority] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Second Opinion Requests</h1>
        <Button
          onClick={() => navigate('/patient/request-second-opinion')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + New Request
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No second opinion requests yet</p>
          <Button
            onClick={() => navigate('/patient/request-second-opinion')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Request Second Opinion
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests List */}
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className={`bg-white rounded-lg shadow-md p-5 cursor-pointer border-2 transition-all ${
                  selectedRequest?._id === request._id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => handleViewDetails(request)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(request.priority)}`}>
                      {request.priority.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </span>
                </div>

                <p className="font-semibold text-gray-800 mb-2">
                  {request.chiefComplaint.substring(0, 100)}
                  {request.chiefComplaint.length > 100 && '...'}
                </p>

                {request.assignedDoctor && (
                  <p className="text-sm text-gray-600 mb-2">
                    👨‍⚕️ Dr. {request.assignedDoctor.name} - {request.assignedDoctor.specialization}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                  <span>📄 {request.medicalReports?.length || 0} reports</span>
                  <span>⏱️ {request.estimatedResponseTime}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {selectedRequest ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Request Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-gray-700">Status:</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700">Chief Complaint:</label>
                    <p className="text-gray-600 mt-1">{selectedRequest.chiefComplaint}</p>
                  </div>

                  {selectedRequest.medicalHistory && (
                    <div>
                      <label className="font-semibold text-gray-700">Medical History:</label>
                      <p className="text-gray-600 mt-1">{selectedRequest.medicalHistory}</p>
                    </div>
                  )}

                  {selectedRequest.currentMedications && (
                    <div>
                      <label className="font-semibold text-gray-700">Current Medications:</label>
                      <p className="text-gray-600 mt-1">{selectedRequest.currentMedications}</p>
                    </div>
                  )}

                  {selectedRequest.assignedDoctor && (
                    <div>
                      <label className="font-semibold text-gray-700">Assigned Doctor:</label>
                      <p className="text-gray-600 mt-1">
                        Dr. {selectedRequest.assignedDoctor.name}<br />
                        {selectedRequest.assignedDoctor.specialization}
                      </p>
                    </div>
                  )}

                  {selectedRequest.doctorOpinion?.diagnosis && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-bold text-green-800 mb-3">Doctor's Opinion</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="font-semibold text-gray-700">Diagnosis:</label>
                          <p className="text-gray-700 mt-1">{selectedRequest.doctorOpinion.diagnosis}</p>
                        </div>

                        <div>
                          <label className="font-semibold text-gray-700">Recommendations:</label>
                          <p className="text-gray-700 mt-1">{selectedRequest.doctorOpinion.recommendations}</p>
                        </div>

                        {selectedRequest.doctorOpinion.prescribedTreatment && (
                          <div>
                            <label className="font-semibold text-gray-700">Prescribed Treatment:</label>
                            <p className="text-gray-700 mt-1">{selectedRequest.doctorOpinion.prescribedTreatment}</p>
                          </div>
                        )}

                        {selectedRequest.doctorOpinion.additionalNotes && (
                          <div>
                            <label className="font-semibold text-gray-700">Additional Notes:</label>
                            <p className="text-gray-700 mt-1">{selectedRequest.doctorOpinion.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-gray-700 mb-2 block">Uploaded Reports:</label>
                    <div className="space-y-3">
                      {selectedRequest.medicalReports?.map((report, idx) => {
                        const fileSize = report.fileSize ? (report.fileSize / 1024).toFixed(2) : 'Unknown';
                        const description = report.description || 'No description';
                        
                        return (
                          <div key={idx} className="bg-gray-50 hover:bg-gray-100 p-3 rounded border border-gray-200 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="text-lg mt-0.5">📄</span>
                                <div className="flex-1 min-w-0">
                                  <a 
                                    href={`http://localhost:5000${report.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium block truncate"
                                  >
                                    {report.fileName}
                                  </a>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Type: {report.reportType} • Size: {fileSize} KB • {description}
                                  </div>
                                </div>
                              </div>
                              <a
                                href={`http://localhost:5000${report.fileUrl}`}
                                download
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors whitespace-nowrap"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {['pending', 'assigned'].includes(selectedRequest.status) && (
                    <Button
                      onClick={() => handleCancelRequest(selectedRequest._id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-4"
                    >
                      Cancel Request
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <p className="text-gray-500">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MySecondOpinions;
