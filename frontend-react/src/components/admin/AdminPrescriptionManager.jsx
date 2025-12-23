import React, { useState, useEffect } from 'react';
import { prescriptionAPI } from '../../services/api';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const AdminPrescriptionManager = ({ onViewPrescription, onDeletePrescription }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrescriptions, setTotalPrescriptions] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    doctorName: '',
    patientName: '',
    limit: 20
  });
  const [inputValues, setInputValues] = useState({
    doctorName: '',
    patientName: ''
  });
  const [searchDebounce, setSearchDebounce] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [currentPage, filters]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: currentPage,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await prescriptionAPI.getAllPrescriptions(params);
      setPrescriptions(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalPrescriptions(response.data.totalPrescriptions || 0);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      setError(error.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    // For text inputs (doctorName, patientName), only update input values
    if (field === 'doctorName' || field === 'patientName') {
      setInputValues(prev => ({ ...prev, [field]: value }));
    } else {
      // For non-text inputs (status, limit), update filters immediately
      setFilters(prev => ({ ...prev, [field]: value }));
      setCurrentPage(1);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ 
      ...prev, 
      doctorName: inputValues.doctorName,
      patientName: inputValues.patientName
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      doctorName: '',
      patientName: '',
      limit: 20
    });
    setInputValues({
      doctorName: '',
      patientName: ''
    });
    setCurrentPage(1);
  };

  const handleDelete = async (prescription) => {
    if (!deleteConfirm || deleteConfirm._id !== prescription._id) {
      setDeleteConfirm(prescription);
      return;
    }

    setDeleting(true);
    try {
      await prescriptionAPI.deletePrescription(prescription._id);
      setPrescriptions(prev => prev.filter(p => p._id !== prescription._id));
      setDeleteConfirm(null);
      onDeletePrescription?.(prescription);
    } catch (error) {
      console.error('Failed to delete prescription:', error);
      setError(error.response?.data?.message || 'Failed to delete prescription');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrescriptionAge = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="secondary"
          >
            Next
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span> ({totalPrescriptions} total prescriptions)
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === page
                        ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading prescription data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[rgb(var(--text-heading))]">Prescription Management</h2>
          <p className="text-[rgb(var(--text-secondary))]">Manage all system prescriptions and monitor doctor activities</p>
        </div>
        <div className="text-sm text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] px-3 py-2 rounded-lg">
          Total: {totalPrescriptions} prescriptions
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="label">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="label">
              Doctor Name
            </label>
            <input
              type="text"
              value={inputValues.doctorName}
              onChange={(e) => handleFilterChange('doctorName', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by doctor name..."
              className="input-field"
            />
          </div>
          
          <div>
            <label className="label">
              Patient Name
            </label>
            <input
              type="text"
              value={inputValues.patientName}
              onChange={(e) => handleFilterChange('patientName', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by patient name..."
              className="input-field"
            />
          </div>
          
          <div>
            <label className="label">
              Results per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="input-field"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <Button
              onClick={handleSearch}
              variant="primary"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Search
            </Button>
            <Button
              onClick={clearFilters}
              variant="secondary"
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-[rgb(var(--text-heading))]">Delete Prescription</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                Are you sure you want to delete prescription #{deleteConfirm.prescriptionNumber} for {deleteConfirm.patient?.name}? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? <LoadingSpinner size="sm" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions Table */}
      {prescriptions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-[rgb(var(--text-secondary))] mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[rgb(var(--text-heading))] mb-2">No prescriptions found</h3>
          <p className="text-[rgb(var(--text-secondary))]">
            {filters.status || filters.doctorName || filters.patientName ? 
              'No prescriptions match your current filters.' : 
              'No prescriptions have been created yet.'
            }
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
              <thead className="bg-[rgb(var(--bg-secondary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Prescription Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Medicines
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-color))]">
                {prescriptions.map((prescription) => (
                  <tr key={prescription._id} className="hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        #{prescription.prescriptionNumber}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {getPrescriptionAge(prescription.createdAt)}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">
                        {formatDate(prescription.createdAt)} {formatTime(prescription.createdAt)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {prescription.patient?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {prescription.patient?.email}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">
                        {prescription.patient?.phone}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {prescription.doctor?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {prescription.doctor?.specialization}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-[rgb(var(--text-primary))] max-w-xs">
                        <p className="truncate" title={prescription.diagnosis}>
                          {prescription.diagnosis}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-[rgb(var(--text-primary))]">
                        {prescription.medicines?.length || 0} medicine(s)
                      </div>
                      {prescription.medicines?.length > 0 && (
                        <div className="text-xs text-[rgb(var(--text-secondary))] max-w-xs truncate">
                          {prescription.medicines[0].name}
                          {prescription.medicines.length > 1 && ` +${prescription.medicines.length - 1} more`}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(prescription.status)}`}>
                        {prescription.status || 'active'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {onViewPrescription && (
                          <button
                            onClick={() => onViewPrescription(prescription)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View prescription details"
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(prescription)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete prescription"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptionManager;