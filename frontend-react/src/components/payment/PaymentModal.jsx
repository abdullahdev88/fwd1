import React, { useState } from 'react';
import { paymentAPI } from '../../services/api';

const PaymentModal = ({ appointment, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [phoneNumber, setPhoneNumber] = useState('');

  const paymentMethods = [
    { value: 'credit_card', label: '💳 Credit Card', icon: '💳' },
    { value: 'debit_card', label: '💳 Debit Card', icon: '💳' },
    { value: 'easypaisa', label: '📱 Easypaisa', icon: '📱' },
    { value: 'jazzcash', label: '📱 JazzCash', icon: '📱' }
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
      alert(`✅ Payment Successful!\n\nTransaction ID: ${response.data.data.transactionId}\nInvoice: ${response.data.data.invoiceNumber}`);
      
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
              ⚠️ Simulation Mode - No real money will be charged
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
                Select Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSelectedMethod(method.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      selectedMethod === method.value
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{method.icon}</span>
                      <span className="text-sm font-medium">{method.label.replace(method.icon + ' ', '')}</span>
                    </div>
                    {selectedMethod === method.value && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-600 font-medium">✓ Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number for Mobile Wallets */}
            {(selectedMethod === 'easypaisa' || selectedMethod === 'jazzcash') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="03XX XXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                  maxLength="11"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your {selectedMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} registered number
                </p>
              </div>
            )}

            {/* Credit/Debit Card Notice */}
            {(selectedMethod === 'credit_card' || selectedMethod === 'debit_card') && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">💳</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Card Payment</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      In simulation mode, card details are not required. Payment will be automatically processed.
                    </p>
                    <div className="bg-white border border-gray-300 rounded px-3 py-2 text-sm">
                      <span className="font-medium">Test Card:</span> 4111 1111 1111 1111<br/>
                      <span className="font-medium">Expiry:</span> 12/25 | <span className="font-medium">CVV:</span> 123
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  <>💳 Pay PKR {(appointment.consultationFee || 2000).toLocaleString()}</>
                )}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-500 mt-4">
              🔒 This is a simulated payment. No real money will be charged.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
