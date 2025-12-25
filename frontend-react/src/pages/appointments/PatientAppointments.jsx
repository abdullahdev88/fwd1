import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, paymentAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PaymentModal from '../../components/payment/PaymentModal';

const PatientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchMyAppointments();
    }
  }, [user]);

  const fetchMyAppointments = async () => {
    try {
      const response = await appointmentAPI.getMyAppointments();
      const appointmentsData = response.data.data;
      setAppointments(appointmentsData);
      
      // Check payment status for each approved appointment
      appointmentsData.forEach(appointment => {
        if (appointment.status === 'approved') {
          checkPaymentStatus(appointment._id);
        }
      });
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (appointmentId) => {
    try {
      const response = await paymentAPI.getPaymentByAppointment(appointmentId);
      setPaymentStatuses(prev => ({
        ...prev,
        [appointmentId]: response.data.data
      }));
    } catch (err) {
      // No payment found - that's okay
      setPaymentStatuses(prev => ({
        ...prev,
        [appointmentId]: null
      }));
    }
  };

  const handlePayNow = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    // Update payment status
    setPaymentStatuses(prev => ({
      ...prev,
      [selectedAppointment._id]: paymentData
    }));
    
    // Refresh appointments
    fetchMyAppointments();
  };

  const handleDownloadInvoice = (payment) => {
    const token = localStorage.getItem('token');
    const invoiceUrl = `http://localhost:5000/api/invoices/download/${payment.invoiceNumber}`;
    
    // Add authorization header (for download)
    fetch(invoiceUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${payment.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(err => {
        console.error('Download error:', err);
        alert('Failed to download invoice');
      });
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

  const getPaymentStatusBadge = (appointmentId, appointmentStatus) => {
    if (appointmentStatus !== 'approved') return null;
    
    const payment = paymentStatuses[appointmentId];
    
    if (payment === undefined) {
      return <span className="text-xs text-gray-400">Checking...</span>;
    }
    
    if (!payment) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          💳 Payment Pending
        </span>
      );
    }
    
    if (payment.status === 'pending') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
          🏥 Awaiting Clinic Confirmation
        </span>
      );
    }
    
    if (payment.status === 'paid') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          ✅ Paid
        </span>
      );
    }
    
    if (payment.status === 'refunded') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          🔄 Refunded
        </span>
      );
    }
    
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        {payment.status}
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

  // Filter appointments based on search query
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      appointment.doctor?.name?.toLowerCase().includes(searchLower) ||
      appointment.doctor?.specialization?.toLowerCase().includes(searchLower) ||
      appointment.status?.toLowerCase().includes(searchLower) ||
      appointment.requestMessage?.toLowerCase().includes(searchLower) ||
      formatDateTime(appointment.appointmentDate, appointment.startTime).toLowerCase().includes(searchLower)
    );
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">My Appointments</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">
              View your appointment requests and their status
            </p>
            {!loading && (
              <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 rounded-lg">
                <svg className="w-5 h-5 mr-2 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-[rgb(var(--accent))]">
                  Total Appointments: {appointments.length}
                </span>
              </div>
            )}
          </div>
          <Link
            to="/appointments/book"
            className="btn-primary"
          >
            + Book New Appointment
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by doctor name, specialization, status, message, or date..."
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
            Found {filteredAppointments.length} result(s)
          </p>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {filteredAppointments.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[rgb(var(--text-secondary))] mb-4">
            {searchQuery 
              ? 'No appointments match your search query.' 
              : "You haven't booked any appointments yet."}
          </p>
          {!searchQuery && (
            <Link
              to="/book-appointment"
              className="btn-primary inline-block"
            >
              Book Your First Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
              <thead className="bg-[rgb(var(--bg-secondary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-color))]">
                {filteredAppointments.map((appointment) => {
                  const payment = paymentStatuses[appointment._id];
                  const needsPayment = appointment.status === 'approved' && !payment;
                  const hasPendingPayment = payment && payment.status === 'pending';
                  const hasPaidPayment = payment && payment.status === 'paid';
                  
                  return (
                    <tr key={appointment._id} className="hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {appointment.doctor.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                              Dr. {appointment.doctor.name}
                            </div>
                            <div className="text-sm text-[rgb(var(--text-secondary))]">
                              {appointment.doctor.specialization}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--text-primary))]">
                        {formatDateTime(appointment.appointmentDate, appointment.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(appointment._id, appointment.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[rgb(var(--text-primary))]">
                        <div className="max-w-xs">
                          {appointment.requestMessage || 'No message provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {needsPayment && (
                          <button
                            onClick={() => handlePayNow(appointment)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                          >
                            💳 Pay Now
                          </button>
                        )}
                        
                        {hasPendingPayment && (
                          <div className="text-amber-600 text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <strong>Pending Clinic Confirmation</strong>
                            </div>
                            <p className="text-xs text-gray-500">
                              Please complete payment at clinic
                            </p>
                          </div>
                        )}
                        
                        {hasPaidPayment && (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                              <span className="text-2xl">✅</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-emerald-400">Payment Successful</span>
                                <span className="text-xs text-[rgb(var(--text-secondary))]">
                                  Trans: {payment.transactionId.substring(0, 15)}...
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {appointment.status === 'pending' && (
                          <span className="text-gray-500 text-xs">
                            Waiting for approval
                          </span>
                        )}
                        
                        {appointment.status === 'rejected' && appointment.rejectionReason && (
                          <div className="text-red-600 text-xs max-w-xs">
                            <strong>Reason:</strong> {appointment.rejectionReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedAppointment && (
        <PaymentModal
          appointment={selectedAppointment}
          onSuccess={handlePaymentSuccess}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientAppointments;
