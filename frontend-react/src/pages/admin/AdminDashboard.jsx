import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
    },
    recentUsers: [],
    recentAppointments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockData = {
          stats: {
            totalUsers: 125,
            totalPatients: 95,
            totalDoctors: 25,
            totalAppointments: 340,
          },
          recentUsers: [
            {
              id: 1,
              name: 'Ahmed Ali',
              email: 'ahmed@example.com',
              role: 'patient',
              createdAt: '2024-01-10',
            },
            {
              id: 2,
              name: 'Dr. Sarah Khan',
              email: 'sarah@example.com',
              role: 'doctor',
              createdAt: '2024-01-09',
            },
          ],
          recentAppointments: [
            {
              id: 1,
              patient: 'Ahmed Ali',
              doctor: 'Dr. Hassan',
              date: '2024-01-15',
              status: 'scheduled',
            },
            {
              id: 2,
              patient: 'Fatima Khan',
              doctor: 'Dr. Sarah',
              date: '2024-01-14',
              status: 'completed',
            },
          ],
        };

        setDashboardData(mockData);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.stats.totalUsers}
                  </p>
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
                  <p className="text-2xl font-semibold text-blue-600">
                    {dashboardData.stats.totalPatients}
                  </p>
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
                  <p className="text-sm font-medium text-gray-500">Doctors</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {dashboardData.stats.totalDoctors}
                  </p>
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
                  <p className="text-sm font-medium text-gray-500">Appointments</p>
                  <p className="text-2xl font-semibold text-purple-600">
                    {dashboardData.stats.totalAppointments}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Users
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {dashboardData.recentUsers.map((user) => (
                <li key={user.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'doctor'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{user.createdAt}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Appointments
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {dashboardData.recentAppointments.map((appointment) => (
                <li key={appointment.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.patient}
                      </p>
                      <p className="text-sm text-gray-500">
                        with {appointment.doctor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{appointment.date}</p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
