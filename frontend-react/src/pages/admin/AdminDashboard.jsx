import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import AdminPrescriptionManager from '../../components/admin/AdminPrescriptionManager';
import PrescriptionView from '../../components/doctor/PrescriptionView';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Reports Section Component
const ReportsSection = () => {
  const [reportsData, setReportsData] = useState({
    overview: {},
    doctors: [],
    appointments: {},
    patients: {},
    prescriptions: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial load with loading spinner
    fetchReportsData(true);

    // Auto-refresh every 30 seconds without spinner
    const interval = setInterval(() => {
      fetchReportsData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchReportsData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [overviewRes, doctorsRes, appointmentsRes, patientsRes, prescriptionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/reports/overview`, { headers }),
        axios.get(`${API_BASE_URL}/admin/reports/doctors`, { headers }),
        axios.get(`${API_BASE_URL}/admin/reports/appointments`, { headers }),
        axios.get(`${API_BASE_URL}/admin/reports/patients`, { headers }),
        axios.get(`${API_BASE_URL}/admin/reports/prescriptions`, { headers })
      ]);

      setReportsData({
        overview: overviewRes.data.data || overviewRes.data || {},
        doctors: doctorsRes.data.data || doctorsRes.data || [],
        appointments: appointmentsRes.data.data || appointmentsRes.data || {},
        patients: patientsRes.data.data || patientsRes.data || {},
        prescriptions: prescriptionsRes.data.data || prescriptionsRes.data || {}
      });
      
      if (error) setError(null);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setError('Failed to load reports data');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--accent))]"></div>
        <span className="ml-2 text-[rgb(var(--text-secondary))]">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="text-red-400">{error}</div>
        <button onClick={fetchReportsData} className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded text-sm transition-colors">Retry</button>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[rgb(var(--text-heading))]">Performance & Reports Dashboard</h2>
        <button onClick={fetchReportsData} className="btn-primary">Refresh Data</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total Doctors</p>
              <p className="text-2xl font-semibold text-[rgb(var(--text-heading))]">{reportsData.overview.overview?.totalDoctors || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total Patients</p>
              <p className="text-2xl font-semibold text-emerald-400">{reportsData.overview.overview?.totalPatients || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Today's Appointments</p>
              <p className="text-2xl font-semibold text-[rgb(var(--text-heading))]">{reportsData.overview.overview?.todayAppointments || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Today's Prescriptions</p>
              <p className="text-2xl font-semibold text-purple-400">{reportsData.overview.overview?.todayPrescriptions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-heading))] mb-4">Doctor Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportsData.doctors.topPerformers || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="doctorName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalAppointments" fill="#8884d8" />
              <Bar dataKey="completedAppointments" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-heading))] mb-4">Monthly Appointment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportsData.appointments.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-heading))] mb-4">Appointment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={reportsData.appointments.statusDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count">
                {(reportsData.appointments.statusDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-heading))] mb-4">Most Prescribed Medications</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(reportsData.prescriptions.medicationFrequency || []).slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="medication" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="border-b-2 border-[rgb(var(--border-color))] pb-4 mb-4">
            <h3 className="text-lg font-semibold text-[rgb(var(--text-heading))]">Top Performing Doctors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Appointments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(reportsData.doctors.topPerformers || []).map((doctor, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{doctor.doctorName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{doctor.specialization}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{doctor.totalAppointments}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{doctor.completionRate?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent Appointments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(reportsData.overview.recentAppointments || []).slice(0, 10).map((appointment, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{appointment.patient?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{appointment.doctor?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Payment statistics state
  const [paymentStats, setPaymentStats] = useState(null);
  
  // Prescription state
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  
  // Appointments search state
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  
  // Users search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingDoctors();
    fetchAppointmentLogs();
    fetchAllUsers();
    fetchPaymentStats();
  }, []);

  // Filter appointments based on search query
  useEffect(() => {
    if (!appointmentSearchQuery.trim()) {
      setFilteredAppointments(appointments);
    } else {
      const query = appointmentSearchQuery.toLowerCase();
      const filtered = appointments.filter(appointment => {
        const patientName = appointment.patient?.name?.toLowerCase() || '';
        const doctorName = appointment.doctor?.name?.toLowerCase() || '';
        const status = appointment.status?.toLowerCase() || '';
        
        return patientName.includes(query) || 
               doctorName.includes(query) || 
               status.includes(query);
      });
      setFilteredAppointments(filtered);
    }
  }, [appointmentSearchQuery, appointments]);
  
  // Filter users based on search query
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers(allUsers);
    } else {
      const query = userSearchQuery.toLowerCase();
      const filtered = allUsers.filter(userItem => {
        const name = userItem.name?.toLowerCase() || '';
        const email = userItem.email?.toLowerCase() || '';
        const role = userItem.role?.toLowerCase() || '';
        
        return name.includes(query) || 
               email.includes(query) || 
               role.includes(query);
      });
      setFilteredUsers(filtered);
    }
  }, [userSearchQuery, allUsers]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchPendingDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/pending-doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPendingDoctors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending doctors:', error);
    }
  };

  const fetchAppointmentLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/appointment-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAppointments(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointment logs:', error);
      setLoading(false);
    }
  };

  // Prescription handlers
  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const handleClosePrescriptionView = () => {
    setSelectedPrescription(null);
  };

  const handleDeletePrescription = (prescription) => {
    setDeleteMessage(`Prescription #${prescription.prescriptionNumber} has been deleted successfully.`);
    setTimeout(() => setDeleteMessage(''), 5000);
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAllUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/payments/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPaymentStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleDoctorAction = async (doctorId, action) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? 'approve-doctor' : 'reject-doctor';
      
      const response = await axios.put(`${API_BASE_URL}/admin/${endpoint}/${doctorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`Doctor ${action}d successfully!`);
        fetchPendingDoctors();
        fetchDashboardData();
        fetchAllUsers();
      }
    } catch (error) {
      console.error(`Error ${action}ing doctor:`, error);
      alert(`Error ${action}ing doctor: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/admin/delete-user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('User deleted successfully!');
        fetchAllUsers();
        fetchDashboardData();
        fetchPendingDoctors();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Error deleting user: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-primary))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--accent))] mx-auto"></div>
          <p className="mt-2 text-[rgb(var(--text-secondary))]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">Admin Dashboard</h1>
          <p className="mt-2 text-[rgb(var(--text-secondary))]">System overview and management</p>
        </div>

        {/* Tabs - Added 'payments' beside reports */}
        <div className="mb-8">
          <div className="border-b-2 border-[rgb(var(--border-color))]">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'doctors', 'users', 'appointments', 'prescriptions', 'payments', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-all ${
                    activeTab === tab
                      ? 'border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
                      : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-color))]'
                  }`}
                >
                  {tab === 'doctors' ? `Doctor Approvals (${pendingDoctors.length})` : 
                   tab === 'prescriptions' ? 'Prescription Management' : 
                   tab === 'payments' ? 'Payment Management' : tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab - Removed Red Circle Part (Quick Actions) */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="stat-card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total Users</p>
                    <p className="text-2xl font-semibold text-[rgb(var(--text-heading))]">{stats.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Patients</p>
                    <p className="text-2xl font-semibold text-emerald-400">{stats.totalPatients || 0}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Approved Doctors</p>
                    <p className="text-2xl font-semibold text-emerald-400">{stats.approvedDoctors || 0}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total Appointments</p>
                    <p className="text-2xl font-semibold text-purple-400">{stats.totalAppointments || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Doctors Alert */}
            {pendingDoctors.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-400">
                      Pending Doctor Approvals
                    </h3>
                    <div className="mt-2 text-sm text-amber-300">
                      <p>You have {pendingDoctors.length} doctor(s) waiting for approval.</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setActiveTab('doctors')}
                        className="text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1 rounded transition-colors"
                      >
                        Review Applications
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
            <div className="mb-6">
              <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">
                All Users
              </h3>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                Complete list of all registered users
              </p>
              
              {/* Search Bar */}
              <div className="mt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
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
                {userSearchQuery && (
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                    Found {filteredUsers.length} result(s)
                  </p>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
                <thead className="bg-[rgb(var(--bg-secondary))]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      PMDC ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-color))]">
                  {filteredUsers.map((userItem) => (
                    <tr key={userItem._id} className="hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {userItem.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{userItem.name}</div>
                            {userItem.specialization && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{userItem.specialization}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                        {userItem.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          userItem.role === 'doctor' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                        {userItem.role === 'doctor' && userItem.pmdcId ? userItem.pmdcId : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.status === 'approved' ? 'bg-green-100 text-green-800' :
                          userItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {userItem.status || 'approved'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {userItem._id !== user?.id ? (
                          <button
                            onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-gray-400">You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allUsers.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                No users found
              </div>
            )}
          </div>
        )}

        {/* Doctor Approvals Tab */}
        {activeTab === 'doctors' && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-50">
                Pending Doctor Approvals
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review and approve or reject doctor applications
              </p>
            </div>
            {pendingDoctors.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingDoctors.map((doctor) => (
                  <li key={doctor._id} className="px-4 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">Dr.</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50">{doctor.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.email}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Phone: {doctor.phone}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm"><strong>PMDC ID:</strong> {doctor.pmdcId}</p>
                            <p className="text-sm"><strong>Specialization:</strong> {doctor.specialization}</p>
                            <p className="text-sm"><strong>Experience:</strong> {doctor.experience} years</p>
                            <p className="text-sm"><strong>Education:</strong> {doctor.education}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Applied: {new Date(doctor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleDoctorAction(doctor._id, 'approve')}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDoctorAction(doctor._id, 'reject')}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDeleteUser(doctor._id, doctor.name)}
                          className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                No pending doctor applications
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="card">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">
                Appointment Logs
              </h3>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                All appointment records in the system
              </p>
              
              {/* Search Bar */}
              <div className="mt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by patient name, doctor name, or status..."
                    value={appointmentSearchQuery}
                    onChange={(e) => setAppointmentSearchQuery(e.target.value)}
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
                {appointmentSearchQuery && (
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                    Found {filteredAppointments.length} result(s)
                  </p>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[rgb(var(--border-color))]">
                <thead className="bg-[rgb(var(--bg-secondary))]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Patient
                    </th>
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
                      Booked On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-color))]">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {appointment.patient?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment.patient?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            Dr. {appointment.doctor?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment.doctor?.specialization}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                        <div>
                          <p>{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                          <p className="text-gray-500 dark:text-gray-400">{appointment.startTime} - {appointment.endTime}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'scheduled' 
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(appointment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {appointments.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                No appointments found
              </div>
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div>
            {deleteMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {deleteMessage}
              </div>
            )}
            <AdminPrescriptionManager
              onViewPrescription={handleViewPrescription}
              onDeletePrescription={handleDeletePrescription}
            />
          </div>
        )}

        {/* Payment Management Tab */}
        {activeTab === 'payments' && (
          <div className="card">
             <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">Payment Management</h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Monitor patient payments, refunds, and history</p>
                </div>
                <button onClick={() => navigate('/admin/payments')} className="btn-primary">
                   Go to Payment Portal
                </button>
             </div>
             {paymentStats && (
                <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="stat-card bg-[rgb(var(--bg-tertiary))]">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total Paid</p>
                      <p className="text-2xl font-semibold text-emerald-400">PKR {paymentStats.totalEarnings?.toLocaleString() || 0}</p>
                   </div>
                   <div className="stat-card bg-[rgb(var(--bg-tertiary))]">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Pending Payments</p>
                      <p className="text-2xl font-semibold text-amber-400">{paymentStats.totalPending || 0}</p>
                   </div>
                   <div className="stat-card bg-[rgb(var(--bg-tertiary))]">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Refund Requests</p>
                      <p className="text-2xl font-semibold text-orange-400">{paymentStats.totalRefundRequests || 0}</p>
                   </div>
                </div>
             )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsSection />
        )}

        {/* Prescription View Modal */}
        {selectedPrescription && (
          <PrescriptionView
            prescription={selectedPrescription}
            onClose={handleClosePrescriptionView}
            userRole={user?.role}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;