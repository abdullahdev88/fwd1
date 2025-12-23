import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const AdminPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingRefund, setProcessingRefund] = useState({});

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsResponse = await paymentAPI.getPaymentStatistics();
      setStatistics(statsResponse.data.data);

      // Fetch all payments
      const params = { page: 1, limit: 100 };
      if (statusFilter) params.status = statusFilter;
      
      const paymentsResponse = await paymentAPI.getAllPayments(params);
      setPayments(paymentsResponse.data.data.payments || []);

      // Fetch refund requests
      const refundResponse = await paymentAPI.getRefundRequests();
      setRefundRequests(refundResponse.data.data || []);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payment data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRefund = async (paymentId) => {
    if (!window.confirm('Are you sure you want to approve this refund?')) return;

    setProcessingRefund(prev => ({ ...prev, [paymentId]: true }));

    try {
      await paymentAPI.processRefund(paymentId, { action: 'approve' });
      alert('✅ Refund approved successfully!');
      fetchData();
    } catch (err) {
      alert('Error approving refund: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setProcessingRefund(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleRejectRefund = async (paymentId) => {
    const reason = prompt('Enter reason for rejection (optional):');
    if (reason === null) return;

    setProcessingRefund(prev => ({ ...prev, [paymentId]: true }));

    try {
      await paymentAPI.rejectRefund(paymentId, { reason });
      alert('❌ Refund rejected');
      fetchData();
    } catch (err) {
      alert('Error rejecting refund: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setProcessingRefund(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refund_requested: 'bg-orange-100 text-orange-800',
      refunded: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || statusStyles.pending}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">💰 Payment Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor all payments and handle refund requests
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  PKR {statistics.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl">💵</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.totalPayments || 0}
                </p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Refunded Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  PKR {statistics.totalRefunded?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Refunds</p>
                <p className="text-2xl font-bold text-orange-600">
                  {refundRequests.length}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'refunds'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Refund Requests ({refundRequests.length})
          </button>
        </nav>
      </div>

      {/* All Payments Tab */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="refund_requested">Refund Requested</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {payment.transactionId?.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.patient?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.patient?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Dr. {payment.doctor?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.doctor?.specialization || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      PKR {payment.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.transactionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No payments found</p>
            </div>
          )}
        </div>
      )}

      {/* Refund Requests Tab */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {refundRequests.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {payment.transactionId?.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.patient?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.patient?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Dr. {payment.doctor?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      PKR {payment.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      {payment.refundReason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.refundRequestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApproveRefund(payment._id)}
                        disabled={processingRefund[payment._id]}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleRejectRefund(payment._id)}
                        disabled={processingRefund[payment._id]}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {refundRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-500">No pending refund requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
