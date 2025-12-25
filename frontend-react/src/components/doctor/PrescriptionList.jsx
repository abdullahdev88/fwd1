import React, { useState, useEffect } from 'react';
import { prescriptionAPI } from '../../services/api';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const PrescriptionList = ({ onViewPrescription, onEditPrescription, onCreateNew }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    patientName: '',
    limit: 10
  });

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

      const response = await prescriptionAPI.getDoctorPrescriptions(params);
      setPrescriptions(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please refresh the page and log in again.');
      } else {
        setError(error.response?.data?.message || 'Failed to load prescriptions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, patientName: searchInput }));
    setCurrentPage(1);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      status: '',
      patientName: '',
      limit: 10
    });
    setCurrentPage(1);
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



  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-[rgb(var(--border-color))] bg-[rgb(var(--bg-secondary))] px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[rgb(var(--text-secondary))] ring-1 ring-inset ring-[rgb(var(--border-color))] hover:bg-[rgb(var(--bg-tertiary))] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                        ? 'z-10 bg-[rgb(var(--accent))] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]'
                        : 'text-[rgb(var(--text-primary))] ring-1 ring-inset ring-[rgb(var(--border-color))] hover:bg-[rgb(var(--bg-tertiary))] focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[rgb(var(--text-secondary))] ring-1 ring-inset ring-[rgb(var(--border-color))] hover:bg-[rgb(var(--bg-tertiary))] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
    return <LoadingSpinner message="Loading prescriptions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[rgb(var(--text-heading))]">Manage and view your patient prescriptions</h2>
          <p className="text-[rgb(var(--text-secondary))]">Manage and view your patient prescriptions</p>
        </div>
        {onCreateNew && (
          <button onClick={onCreateNew} className="btn-primary w-full sm:w-auto">
            + Create New Prescription
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Patient Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Search by patient name..."
                className="input-field flex-1"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-[rgb(var(--accent))] hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                Search
              </button>
            </div>
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
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-[rgb(var(--text-secondary))] mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[rgb(var(--text-heading))] mb-2">No prescriptions found</h3>
          <p className="text-[rgb(var(--text-secondary))] mb-4">
            {filters.status || filters.patientName ? 
              'No prescriptions match your current filters.' : 
              'You haven\'t created any prescriptions yet.'
            }
          </p>
          {onCreateNew && (
            <button onClick={onCreateNew} className="btn-primary">
              Create Your First Prescription
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
              <thead className="bg-[rgb(var(--bg-tertiary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Prescription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Patient
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
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[rgb(var(--bg-secondary))] divide-y divide-[rgb(var(--border-color))]">
                {prescriptions.map((prescription) => (
                  <tr key={prescription._id} className="hover:bg-[rgb(var(--bg-tertiary))]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-heading))]">
                        #{prescription.prescriptionNumber}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {formatDate(prescription.createdAt)} at {formatTime(prescription.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-heading))]">
                        {prescription.patient?.name || 'Unknown Patient'}
                      </div>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        {prescription.patient?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[rgb(var(--text-primary))] max-w-xs truncate">
                        {prescription.diagnosis}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[rgb(var(--text-primary))]">
                        {prescription.medicines?.length || 0} medicine(s)
                      </div>
                      {prescription.medicines?.length > 0 && (
                        <div className="text-sm text-[rgb(var(--text-secondary))]">
                          {prescription.medicines[0].name}
                          {prescription.medicines.length > 1 && ` +${prescription.medicines.length - 1} more`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prescription.status === 'active' ? 'badge-success' : 
                        prescription.status === 'completed' ? 'badge-info' : 
                        'badge-error'
                      }`}>
                        {prescription.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--text-secondary))]">
                      {formatDate(prescription.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {onViewPrescription && (
                          <button
                            onClick={() => onViewPrescription(prescription)}
                            className="text-[rgb(var(--accent))] hover:text-blue-400"
                          >
                            View
                          </button>
                        )}
                        {onEditPrescription && (
                          <button
                            onClick={() => onEditPrescription(prescription)}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            Edit
                          </button>
                        )}
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

export default PrescriptionList;