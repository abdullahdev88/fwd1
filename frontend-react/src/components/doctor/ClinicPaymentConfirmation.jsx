import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClinicPaymentConfirmation = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);

  useEffect(() => {
    fetchPendingPayments();
    const interval = setInterval(fetchPendingPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/payments/doctor/earnings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const pending = response.data.data.filter(
        payment => payment.status === 'pending' && payment.paymentMethod === 'clinic_visit'
      );
      
      setPendingPayments(pending);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId) => {
    if (!window.confirm('Confirm that this payment has been received at the clinic?')) {
      return;
    }

    setConfirmingPaymentId(paymentId);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/payments/${paymentId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Payment confirmed successfully!');
      fetchPendingPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert(error.response?.data?.message || 'Error confirming payment');
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--accent))]"></div>
        </div>
      </div>
    );
  }

  if (pendingPayments.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))] mb-4">
          🏥 Pending Clinic Payments
        </h3>
        <div className="text-center py-8 text-[rgb(var(--text-secondary))]">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No pending clinic payments</p>
          <p className="text-sm mt-2">Payments confirmed will appear as completed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">
            🏥 Pending Clinic Payments
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            Confirm payments received at clinic reception
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
          {pendingPayments.length} Pending
        </span>
      </div>

      <div className="space-y-4">
        {pendingPayments.map((payment) => (
          <div
            key={payment._id}
            className="border-2 border-[rgb(var(--border-color))] rounded-lg p-4 hover:border-[rgb(var(--accent))] transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-semibold text-[rgb(var(--text-heading))]">
                    {payment.patient?.name || 'Unknown Patient'}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-xs font-medium">
                    Pending Confirmation
                  </span>
                </div>

                <div className="space-y-1 text-sm text-[rgb(var(--text-secondary))]">
                  <p>📧 {payment.patient?.email}</p>
                  <p>📅 {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}</p>
                  <p>💰 Amount: <span className="font-bold text-emerald-400">PKR {payment.amount.toLocaleString()}</span></p>
                  <p>🏥 Payment Method: Clinic Visit</p>
                  {payment.appointment?.appointmentDate && (
                    <p>📅 Appointment: {new Date(payment.appointment.appointmentDate).toLocaleDateString()} at {payment.appointment.startTime}</p>
                  )}
                </div>

                {payment.description && (
                  <p className="mt-2 text-sm text-[rgb(var(--text-primary))] bg-[rgb(var(--bg-primary))] p-2 rounded">
                    {payment.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => confirmPayment(payment._id)}
                disabled={confirmingPaymentId === payment._id}
                className="ml-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {confirmingPaymentId === payment._id ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Received
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicPaymentConfirmation;
