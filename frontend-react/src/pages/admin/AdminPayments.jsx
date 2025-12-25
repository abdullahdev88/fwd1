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
      console.log('Stats Response:', statsResponse.data);
      setStatistics(statsResponse.data.statistics || statsResponse.data.data);

      // Fetch all payments
      const params = { page: 1, limit: 100 };
      if (statusFilter) params.status = statusFilter;
      
      const paymentsResponse = await paymentAPI.getAllPayments(params);
      console.log('Payments Response:', paymentsResponse.data);
      setPayments(paymentsResponse.data.data || paymentsResponse.data.payments || []);

      // Fetch refund requests
      const refundResponse = await paymentAPI.getRefundRequests();
      console.log('Refund Response:', refundResponse.data);
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
      pending: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
      paid: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
      failed: 'bg-red-500/10 border border-red-500/20 text-red-400',
      refund_requested: 'bg-orange-500/10 border border-orange-500/20 text-orange-400',
      refunded: 'bg-purple-500/10 border border-purple-500/20 text-purple-400',
      cancelled: 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
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
        <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">💰 Payment Management</h1>
        <p className="text-[rgb(var(--text-secondary))] mt-2">
          Monitor all payments and handle refund requests
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))]">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">
                  PKR {statistics.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl">💵</div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))]">Total Payments</p>
                <p className="text-2xl font-bold text-[rgb(var(--accent))]">
                  {statistics.totalPayments || 0}
                </p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))]">Refunded Amount</p>
                <p className="text-2xl font-bold text-purple-400">
                  PKR {statistics.totalRefunded?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))]">Pending Refunds</p>
                <p className="text-2xl font-bold text-amber-400">
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
        <nav className="flex space-x-8 border-b border-[rgb(var(--border-color))]">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
                : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            All Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'refunds'
                ? 'border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
                : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Refund Requests ({refundRequests.length})
          </button>
        </nav>
      </div>

      {/* All Payments Tab */}
      {activeTab === 'all' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--border-color))]">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-[rgb(var(--text-primary))]">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-color))] text-[rgb(var(--text-primary))] rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="refund_requested">Refund Requested</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
              <thead className="bg-[rgb(var(--bg-tertiary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-[rgb(var(--bg-primary))] divide-y divide-[rgb(var(--border-color))]">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[rgb(var(--text-primary))]">
                      {payment.transactionId?.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-heading))]">
                        {payment.patient?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {payment.patient?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-heading))]">
                        Dr. {payment.doctor?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {payment.doctor?.specialization || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-400">
                      PKR {payment.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--text-primary))]">
                      {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--text-secondary))]">
                      {formatDate(payment.transactionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[rgb(var(--text-secondary))]">No payments found</p>
            </div>
          )}
        </div>
      )}

      {/* Refund Requests Tab */}
      {activeTab === 'refunds' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
              <thead className="bg-[rgb(var(--bg-tertiary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[rgb(var(--bg-primary))] divide-y divide-[rgb(var(--border-color))]">
                {refundRequests.map((payment) => (
                  <tr key={payment._id} className="hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[rgb(var(--text-primary))]">
                      {payment.transactionId?.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-heading))]">
                        {payment.patient?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {payment.patient?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-heading))]">
                        Dr. {payment.doctor?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-400">
                      PKR {payment.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-[rgb(var(--text-primary))] max-w-xs">
                      {payment.refundReason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--text-secondary))]">
                      {formatDate(payment.refundRequestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApproveRefund(payment._id)}
                        disabled={processingRefund[payment._id]}
                        className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleRejectRefund(payment._id)}
                        disabled={processingRefund[payment._id]}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
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
              <p className="text-[rgb(var(--text-secondary))]">No pending refund requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
