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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))] mb-2">My Second Opinion Requests</h1>
        <p className="text-[rgb(var(--text-secondary))]">View and track all your second opinion requests</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {requests.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="flex flex-col items-center space-y-6">
            {/* Icon */}
            <div className="w-24 h-24 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            {/* Text */}
            <div>
              <h3 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-2">No second opinion requests yet</h3>
              <p className="text-[rgb(var(--text-secondary))] max-w-md mx-auto">
                Get expert medical opinions from our qualified specialists. Submit your first request to get started.
              </p>
            </div>
            
            {/* Action Button */}
            <Button
              onClick={() => navigate('/patient/request-second-opinion')}
              className="btn-primary px-8 py-3 text-base"
            >
              Request Second Opinion
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests List */}
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className={`card p-5 cursor-pointer border-2 transition-all ${
                  selectedRequest?._id === request._id ? 'border-[rgb(var(--accent))]' : 'border-transparent hover:border-[rgb(var(--border-color))]'
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
                  <span className="text-xs text-[rgb(var(--text-secondary))]">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </span>
                </div>

                <p className="font-semibold text-[rgb(var(--text-heading))] mb-2">
                  {request.chiefComplaint.substring(0, 100)}
                  {request.chiefComplaint.length > 100 && '...'}
                </p>

                {request.assignedDoctor && (
                  <p className="text-sm text-[rgb(var(--text-secondary))] mb-2">
                    👨‍⚕️ Dr. {request.assignedDoctor.name} - {request.assignedDoctor.specialization}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-secondary))] mt-3">
                  <span>📄 {request.medicalReports?.length || 0} reports</span>
                  <span>⏱️ {request.estimatedResponseTime}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {selectedRequest ? (
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-4 text-[rgb(var(--text-heading))]">Request Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-[rgb(var(--text-primary))]">Status:</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-[rgb(var(--text-primary))]">Chief Complaint:</label>
                    <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedRequest.chiefComplaint}</p>
                  </div>

                  {selectedRequest.medicalHistory && (
                    <div>
                      <label className="font-semibold text-[rgb(var(--text-primary))]">Medical History:</label>
                      <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedRequest.medicalHistory}</p>
                    </div>
                  )}

                  {selectedRequest.currentMedications && (
                    <div>
                      <label className="font-semibold text-[rgb(var(--text-primary))]">Current Medications:</label>
                      <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedRequest.currentMedications}</p>
                    </div>
                  )}

                  {selectedRequest.assignedDoctor && (
                    <div>
                      <label className="font-semibold text-[rgb(var(--text-primary))]">Assigned Doctor:</label>
                      <p className="text-[rgb(var(--text-secondary))] mt-1">
                        Dr. {selectedRequest.assignedDoctor.name}<br />
                        {selectedRequest.assignedDoctor.specialization}
                      </p>
                    </div>
                  )}

                  {selectedRequest.doctorOpinion?.diagnosis && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h3 className="font-bold text-green-800 dark:text-green-400 mb-3">Doctor's Opinion</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="font-semibold text-[rgb(var(--text-primary))]">Diagnosis:</label>
                          <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedRequest.doctorOpinion.diagnosis}</p>
                        </div>

                        <div>
                          <label className="font-semibold text-[rgb(var(--text-primary))]">Recommendations:</label>
                          <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedRequest.doctorOpinion.recommendations}</p>
                        </div>

                        {selectedRequest.doctorOpinion.prescribedTreatment && (
                          <div>
                            <label className="font-semibold text-[rgb(var(--text-primary))]">Prescribed Treatment:</label>
                            <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedRequest.doctorOpinion.prescribedTreatment}</p>
                          </div>
                        )}

                        {selectedRequest.doctorOpinion.additionalNotes && (
                          <div>
                            <label className="font-semibold text-[rgb(var(--text-primary))]">Additional Notes:</label>
                            <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedRequest.doctorOpinion.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-[rgb(var(--text-primary))] mb-2 block">Uploaded Reports:</label>
                    <div className="space-y-3">
                      {selectedRequest.medicalReports?.map((report, idx) => {
                        const fileSize = report.fileSize ? (report.fileSize / 1024).toFixed(2) : 'Unknown';
                        const description = report.description || 'No description';
                        
                        return (
                          <div key={idx} className="bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-secondary))] p-3 rounded border border-[rgb(var(--border-color))] transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="text-lg mt-0.5">📄</span>
                                <div className="flex-1 min-w-0">
                                  <a 
                                    href={`http://localhost:5000${report.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[rgb(var(--accent))] hover:underline font-medium block truncate"
                                  >
                                    {report.fileName}
                                  </a>
                                  <div className="text-xs text-[rgb(var(--text-secondary))] mt-1">
                                    Type: {report.reportType} • Size: {fileSize} KB • {description}
                                  </div>
                                </div>
                              </div>
                              <a
                                href={`http://localhost:5000${report.fileUrl}`}
                                download
                                className="px-3 py-1 bg-[rgb(var(--accent))] hover:bg-blue-600 text-white text-sm rounded transition-colors whitespace-nowrap"
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
              <div className="card p-12 text-center">
                <p className="text-[rgb(var(--text-secondary))]">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MySecondOpinions;
