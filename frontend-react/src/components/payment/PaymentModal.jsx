import React, { useState } from 'react';
import { paymentAPI } from '../../services/api';

const PaymentModal = ({ appointment, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('clinic_visit');
  const [phoneNumber, setPhoneNumber] = useState('');

  const paymentMethods = [
    { value: 'clinic_visit', label: '🏥 Pay at Clinic', icon: '🏥' }
  ];

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await paymentAPI.processPayment({
        appointmentId: appointment._id,
        paymentMethod: selectedMethod,
        amount: appointment.consultationFee || 2000,
        phoneNumber: phoneNumber || null
      });

      // Show success message
      const statusMessage = response.data.data.status === 'pending' 
        ? '✅ Payment Record Created!\n\nPlease complete payment at clinic.\nDoctor will confirm once received.'
        : `✅ Payment Successful!\n\nTransaction ID: ${response.data.data.transactionId}\nInvoice: ${response.data.data.invoiceNumber}`;
      
      alert(statusMessage);
      
      // Call success callback
      onSuccess(response.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">💳 Process Payment</h2>
              <p className="text-blue-100 mt-1">Complete your consultation payment</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">Dr. {appointment.doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Specialization:</span>
                <span className="font-medium">{appointment.doctor.specialization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(appointment.appointmentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{appointment.startTime}</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Amount to Pay:</span>
              <span className="text-3xl font-bold text-green-600">
                PKR {(appointment.consultationFee || 2000).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🏥 Please pay at the clinic during your visit
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handlePayment}>
            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">🏥</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Pay at Clinic</h4>
                    <p className="text-sm text-gray-600">
                      Please visit the clinic during your appointment and pay at the reception desk. We accept cash and card payments on-site.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-orange-600 mt-3 flex items-start">
                <span className="mr-1">ℹ️</span>
                <span>Online payment methods (Credit Card, Debit Card, Easypaisa, JazzCash) are currently unavailable. All payments must be made in-person at the clinic.</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>✅ Confirm Clinic Payment</>
                )}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-500 mt-4">
              🏥 Payment record will be created. Please complete payment at clinic reception.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
