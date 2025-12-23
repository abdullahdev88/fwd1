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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600 mt-2">
              View your appointment requests and their status
            </p>
          </div>
          <Link
            to="/book-appointment"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            + Book New Appointment
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't booked any appointments yet.</p>
          <Link
            to="/book-appointment"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Book Your First Appointment
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => {
                  const payment = paymentStatuses[appointment._id];
                  const needsPayment = appointment.status === 'approved' && !payment;
                  const hasPaidPayment = payment && payment.status === 'paid';
                  
                  return (
                    <tr key={appointment._id} className="hover:bg-gray-50">
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
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {appointment.doctor.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.doctor.specialization}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(appointment.appointmentDate, appointment.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(appointment._id, appointment.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
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
                            💳 Pay
                          </button>
                        )}
                        
                        {hasPaidPayment && (
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleDownloadInvoice(payment)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              📄 Download Invoice
                            </button>
                            <span className="text-xs text-gray-500">
                              Trans: {payment.transactionId.substring(0, 15)}...
                            </span>
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
