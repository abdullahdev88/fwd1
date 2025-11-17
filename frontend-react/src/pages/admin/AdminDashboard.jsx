import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchPendingDoctors();
    fetchAppointmentLogs();
    fetchAllUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
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
      const response = await axios.get('http://localhost:5000/api/admin/pending-doctors', {
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
      const response = await axios.get('http://localhost:5000/api/admin/appointment-logs', {
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

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/all-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAllUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDoctorAction = async (doctorId, action) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? 'approve-doctor' : 'reject-doctor';
      
      const response = await axios.put(`http://localhost:5000/api/admin/${endpoint}/${doctorId}`, {}, {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">System overview and management</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'doctors', 'users', 'appointments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'doctors' ? `Doctor Approvals (${pendingDoctors.length})` : tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🏥</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Patients</p>
                      <p className="text-2xl font-semibold text-blue-600">{stats.totalPatients || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">👨‍⚕️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Approved Doctors</p>
                      <p className="text-2xl font-semibold text-green-600">{stats.approvedDoctors || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📅</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                      <p className="text-2xl font-semibold text-purple-600">{stats.totalAppointments || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Doctors Alert */}
            {pendingDoctors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Pending Doctor Approvals
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You have {pendingDoctors.length} doctor(s) waiting for approval.</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setActiveTab('doctors')}
                        className="text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded"
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
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                All Users
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete list of all registered users
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((userItem) => (
                    <tr key={userItem._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {userItem.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                            {userItem.specialization && (
                              <div className="text-sm text-gray-500">{userItem.specialization}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.status === 'approved' ? 'bg-green-100 text-green-800' :
                          userItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {userItem.status || 'approved'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
              <div className="px-4 py-6 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        )}

        {/* Doctor Approvals Tab */}
        {activeTab === 'doctors' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Pending Doctor Approvals
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Review and approve or reject doctor applications
              </p>
            </div>
            {pendingDoctors.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {pendingDoctors.map((doctor) => (
                  <li key={doctor._id} className="px-4 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">Dr.</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{doctor.name}</h4>
                          <p className="text-sm text-gray-500">{doctor.email}</p>
                          <p className="text-sm text-gray-600">Phone: {doctor.phone}</p>
                          <div className="mt-2 space-y-1">
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
              <div className="px-4 py-6 text-center text-gray-500">
                No pending doctor applications
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Appointment Logs
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                All appointment records in the system
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
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
                      Booked On
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.patient?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.patient?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctor?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctor?.specialization}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <p>{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                          <p className="text-gray-500">{appointment.startTime} - {appointment.endTime}</p>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(appointment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {appointments.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500">
                No appointments found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
