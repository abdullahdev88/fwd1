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

  const handleApprove = async (appointmentId, notes = '') => {
    setActionLoading(prev => ({ ...prev, [appointmentId]: 'approving' }));
    
    try {
      await appointmentAPI.approveAppointment(appointmentId, notes);
      
      // Refresh the appointments
      await fetchAppointments();
      
    } catch (err) {
      alert('Error approving appointment: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: null }));
    }
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

  const currentAppointments = activeTab === 'pending' ? pendingRequests : allAppointments;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Appointment Requests</h1>
        <p className="text-gray-600 mt-2">
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
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Appointments ({allAppointments.length})
          </button>
        </nav>
      </div>

      {error && <ErrorMessage message={error} />}

      {currentAppointments.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'pending' ? 'No Pending Requests' : 'No Appointments'}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'pending' 
              ? "You don't have any pending appointment requests."
              : "You don't have any appointments yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  {activeTab === 'pending' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
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
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.patient.email}
                          </div>
                          {appointment.patient.phone && (
                            <div className="text-sm text-gray-500">
                              {appointment.patient.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(appointment.appointmentDate, appointment.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {appointment.requestMessage || 'No message provided'}
                      </div>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApprove(appointment._id)}
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
    </div>
  );
};

export default DoctorAppointmentRequests;