import React, { useState, useEffect } from 'react';
import { secondOpinionAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';

const DoctorSecondOpinions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, my-cases
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showOpinionForm, setShowOpinionForm] = useState(false);
  const [opinionData, setOpinionData] = useState({
    diagnosis: '',
    recommendations: '',
    prescribedTreatment: '',
    additionalNotes: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const response = await secondOpinionAPI.getPendingRequests();
        setPendingRequests(response.data.data);
      } else {
        const response = await secondOpinionAPI.getMyCases();
        setMyCases(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await secondOpinionAPI.acceptRequest(requestId);
      fetchData();
      setActiveTab('my-cases');
    } catch (err) {
      setError('Failed to accept request');
    }
  };

  const handleStartReview = async (requestId) => {
    try {
      await secondOpinionAPI.startReview(requestId);
      fetchData();
    } catch (err) {
      setError('Failed to start review');
    }
  };

  const handleViewCase = async (caseData) => {
    try {
      const response = await secondOpinionAPI.getCaseDetails(caseData._id);
      setSelectedCase(response.data.data);
      setShowOpinionForm(false);
    } catch (err) {
      setError('Failed to fetch case details');
    }
  };

  const handleSubmitOpinion = async (e) => {
    e.preventDefault();
    try {
      await secondOpinionAPI.submitOpinion(selectedCase._id, opinionData);
      setShowOpinionForm(false);
      setOpinionData({
        diagnosis: '',
        recommendations: '',
        prescribedTreatment: '',
        additionalNotes: ''
      });
      fetchData();
      setSelectedCase(null);
    } catch (err) {
      setError('Failed to submit opinion');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      under_review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
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
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[rgb(var(--text-heading))]">Second Opinion Cases</h1>

      {error && <ErrorMessage message={error} />}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'bg-[rgb(var(--accent))] text-white'
              : 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))]'
          }`}
        >
          Pending Requests ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('my-cases')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'my-cases'
              ? 'bg-[rgb(var(--accent))] text-white'
              : 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))]'
          }`}
        >
          My Cases ({myCases.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases List */}
        <div className="space-y-4">
          {activeTab === 'pending' ? (
            pendingRequests.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-[rgb(var(--text-secondary))]">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request._id} className="card p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(request.priority)}`}>
                      {request.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-[rgb(var(--text-secondary))]">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-semibold text-[rgb(var(--text-heading))] mb-2">{request.chiefComplaint.substring(0, 100)}...</p>
                  <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
                    Patient: {request.patient?.name} • {request.medicalReports?.length || 0} reports
                  </p>

                  <Button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Accept Case
                  </Button>
                </div>
              ))
            )
          ) : (
            myCases.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-[rgb(var(--text-secondary))]">No assigned cases</p>
              </div>
            ) : (
              myCases.map((caseItem) => (
                <div
                  key={caseItem._id}
                  className={`card p-5 cursor-pointer border-2 transition-all ${
                    selectedCase?._id === caseItem._id ? 'border-[rgb(var(--accent))]' : 'border-transparent hover:border-[rgb(var(--border-color))]'
                  }`}
                  onClick={() => handleViewCase(caseItem)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(caseItem.status)}`}>
                      {caseItem.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-[rgb(var(--text-secondary))]">
                      {new Date(caseItem.requestDate).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-semibold text-[rgb(var(--text-heading))] mb-2">{caseItem.chiefComplaint.substring(0, 100)}...</p>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">Patient: {caseItem.patient?.name}</p>
                </div>
              ))
            )
          )}
        </div>

        {/* Case Details / Opinion Form */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {selectedCase ? (
            showOpinionForm ? (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4 text-[rgb(var(--text-heading))]">Submit Opinion</h2>
                <form onSubmit={handleSubmitOpinion} className="space-y-4">
                  <div>
                    <label className="label">Diagnosis *</label>
                    <textarea
                      value={opinionData.diagnosis}
                      onChange={(e) => setOpinionData({ ...opinionData, diagnosis: e.target.value })}
                      required
                      rows="3"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Recommendations *</label>
                    <textarea
                      value={opinionData.recommendations}
                      onChange={(e) => setOpinionData({ ...opinionData, recommendations: e.target.value })}
                      required
                      rows="3"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Prescribed Treatment</label>
                    <textarea
                      value={opinionData.prescribedTreatment}
                      onChange={(e) => setOpinionData({ ...opinionData, prescribedTreatment: e.target.value })}
                      rows="2"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Additional Notes</label>
                    <textarea
                      value={opinionData.additionalNotes}
                      onChange={(e) => setOpinionData({ ...opinionData, additionalNotes: e.target.value })}
                      rows="2"
                      className="input-field"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setShowOpinionForm(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 btn-primary"
                    >
                      Submit Opinion
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-4 text-[rgb(var(--text-heading))]">Case Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-[rgb(var(--text-primary))]">Status:</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(selectedCase.status)}`}>
                        {selectedCase.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-[rgb(var(--text-primary))]">Patient:</label>
                    <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedCase.patient?.name}</p>
                  </div>

                  <div>
                    <label className="font-semibold text-[rgb(var(--text-primary))]">Chief Complaint:</label>
                    <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedCase.chiefComplaint}</p>
                  </div>

                  {selectedCase.medicalHistory && (
                    <div>
                      <label className="font-semibold text-[rgb(var(--text-primary))]">Medical History:</label>
                      <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedCase.medicalHistory}</p>
                    </div>
                  )}

                  {selectedCase.currentMedications && (
                    <div>
                      <label className="font-semibold text-[rgb(var(--text-primary))]">Current Medications:</label>
                      <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedCase.currentMedications}</p>
                    </div>
                  )}

                  {selectedCase.allergies && (
                    <div>
                      <label className="font-semibold text-[rgb(var(--text-primary))]">Allergies:</label>
                      <p className="text-[rgb(var(--text-secondary))] mt-1">{selectedCase.allergies}</p>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-[rgb(var(--text-primary))] mb-2 block">Medical Reports:</label>
                    <div className="space-y-2">
                      {selectedCase.medicalReports?.map((report, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[rgb(var(--bg-tertiary))] p-3 rounded hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                          <span className="text-2xl">📄</span>
                          <div className="flex-1">
                            <a 
                              href={`http://localhost:5000${report.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[rgb(var(--accent))] hover:underline font-medium"
                            >
                              {report.fileName}
                            </a>
                            <div className="text-xs text-gray-500 mt-1">
                              Type: {report.reportType?.replace('_', ' ').toUpperCase()} • Size: {(report.fileSize / 1024).toFixed(1)} KB
                              {report.description && ` • ${report.description}`}
                            </div>
                          </div>
                          <a
                            href={`http://localhost:5000${report.fileUrl}`}
                            download
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedCase.status === 'assigned' && (
                    <Button
                      onClick={() => handleStartReview(selectedCase._id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    >
                      Start Review
                    </Button>
                  )}

                  {['assigned', 'under_review'].includes(selectedCase.status) && (
                    <Button
                      onClick={() => setShowOpinionForm(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Submit Opinion
                    </Button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="card p-12 text-center">
              <p className="text-[rgb(var(--text-secondary))]">Select a case to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorSecondOpinions;
