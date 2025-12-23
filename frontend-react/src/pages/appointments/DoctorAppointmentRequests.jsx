import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const DoctorAppointmentRequests = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState({});
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [consultationFee, setConsultationFee] = useState('2000');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      // Fetch pending requests
      const pendingResponse = await appointmentAPI.getDoctorRequests('pending');
      setPendingRequests(pendingResponse.data.data);

      // Fetch all appointments
      const allResponse = await appointmentAPI.getDoctorAppointments();
      setAllAppointments(allResponse.data.data);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appointmentId, notes = '', fee = 2000) => {
    setActionLoading(prev => ({ ...prev, [appointmentId]: 'approving' }));
    
    try {
      await appointmentAPI.approveAppointment(appointmentId, notes, fee);
      
      // Refresh the appointments
      await fetchAppointments();
      
      // Close modal
      setShowApprovalModal(false);
      setSelectedAppointment(null);
      setConsultationFee('2000');
      setApprovalNotes('');
      
    } catch (err) {
      alert('Error approving appointment: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: null }));
    }
  };

  const openApprovalModal = (appointment) => {
    setSelectedAppointment(appointment);
    setConsultationFee('2000');
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = () => {
    if (!selectedAppointment) return;
    const fee = parseInt(consultationFee) || 2000;
    handleApprove(selectedAppointment._id, approvalNotes, fee);
  };

  const handleReject = async (appointmentId, rejectionReason = '') => {
    const reason = rejectionReason || prompt('Please provide a reason for rejection (optional):');
    
    setActionLoading(prev => ({ ...prev, [appointmentId]: 'rejecting' }));
    
    try {
      await appointmentAPI.rejectAppointment(appointmentId, reason || '');
      
      // Refresh the appointments
      await fetchAppointments();
      
    } catch (err) {
      alert('Error rejecting appointment: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: null }));
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || statusStyles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDateTime = (date, time) => {
    const appointmentDate = new Date(date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = timeObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${formattedDate} at ${formattedTime}`;
  };

  if (loading) return <LoadingSpinner />;

  // Filter appointments based on search query
  const filterAppointments = (appointments) => {
    if (!searchQuery) return appointments;
    const searchLower = searchQuery.toLowerCase();
    return appointments.filter(appointment => 
      appointment.patient?.name?.toLowerCase().includes(searchLower) ||
      appointment.patient?.email?.toLowerCase().includes(searchLower) ||
      appointment.patient?.phone?.toLowerCase().includes(searchLower) ||
      appointment.status?.toLowerCase().includes(searchLower) ||
      appointment.requestMessage?.toLowerCase().includes(searchLower) ||
      formatDateTime(appointment.appointmentDate, appointment.startTime).toLowerCase().includes(searchLower)
    );
  };

  const filteredPendingRequests = filterAppointments(pendingRequests);
  const filteredAllAppointments = filterAppointments(allAppointments);
  const currentAppointments = activeTab === 'pending' ? filteredPendingRequests : filteredAllAppointments;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">Appointment Requests</h1>
        <p className="text-[rgb(var(--text-secondary))] mt-2">
          Manage your appointment requests from patients
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
                : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-color))]'
            }`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
                : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-color))]'
            }`}
          >
            All Appointments ({allAppointments.length})
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by patient name, email, phone, status, message, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-[rgb(var(--text-secondary))]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Found {currentAppointments.length} result(s) in {activeTab === 'pending' ? 'Pending Requests' : 'All Appointments'}
          </p>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {currentAppointments.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-[rgb(var(--text-secondary))] text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-[rgb(var(--text-heading))] mb-2">
            {searchQuery ? 'No Results Found' : activeTab === 'pending' ? 'No Pending Requests' : 'No Appointments'}
          </h3>
          <p className="text-[rgb(var(--text-secondary))]">
            {searchQuery
              ? 'No appointments match your search query.'
              : activeTab === 'pending' 
                ? "You don't have any pending appointment requests."
                : "You don't have any appointments yet."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
              <thead className="bg-[rgb(var(--bg-secondary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Message
                  </th>
                  {activeTab === 'pending' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-color))]">
                {currentAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {appointment.patient.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                            {appointment.patient.name}
                          </div>
                          <div className="text-sm text-[rgb(var(--text-secondary))]">
                            {appointment.patient.email}
                          </div>
                          {appointment.patient.phone && (
                            <div className="text-sm text-[rgb(var(--text-secondary))]">
                              {appointment.patient.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--text-primary))]">
                      {formatDateTime(appointment.appointmentDate, appointment.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[rgb(var(--text-primary))]">
                      <div className="max-w-xs">
                        {appointment.requestMessage || 'No message provided'}
                      </div>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openApprovalModal(appointment)}
                          disabled={actionLoading[appointment._id]}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {actionLoading[appointment._id] === 'approving' ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(appointment._id)}
                          disabled={actionLoading[appointment._id]}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {actionLoading[appointment._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Approval Modal */}
      {showApprovalModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-green-600 text-white p-4 rounded-t-lg">
              <h3 className="text-xl font-bold">✅ Approve Appointment</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Patient:</strong> {selectedAppointment.patient.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {formatDateTime(selectedAppointment.appointmentDate, selectedAppointment.startTime)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee (PKR) *
                </label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  min="0"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 2000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Patient will pay this amount before consultation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any special instructions for the patient..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleApprovalSubmit}
                  disabled={actionLoading[selectedAppointment._id]}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {actionLoading[selectedAppointment._id] ? 'Approving...' : 'Approve & Set Fee'}
                </button>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedAppointment(null);
                    setConsultationFee('2000');
                    setApprovalNotes('');
                  }}
                  disabled={actionLoading[selectedAppointment._id]}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentRequests;