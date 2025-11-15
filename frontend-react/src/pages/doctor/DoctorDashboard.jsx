import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    todayAppointments: [],
    upcomingAppointments: [],
    stats: {
      todayPatients: 0,
      totalPatients: 0,
      completedToday: 0,
      pendingToday: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockData = {
          todayAppointments: [
            {
              id: 1,
              patient: 'Ahmed Ali',
              time: '09:00 AM',
              status: 'completed',
              type: 'Follow-up',
            },
            {
              id: 2,
              patient: 'Fatima Khan',
              time: '10:30 AM',
              status: 'in-progress',
              type: 'Consultation',
            },
            {
              id: 3,
              patient: 'Hassan Ahmed',
              time: '02:00 PM',
              status: 'scheduled',
              type: 'Check-up',
            },
          ],
          upcomingAppointments: [
            {
              id: 4,
              patient: 'Sarah Ali',
              date: '2024-01-16',
              time: '11:00 AM',
              type: 'Consultation',
            },
          ],
          stats: {
            todayPatients: 3,
            totalPatients: 45,
            completedToday: 1,
            pendingToday: 2,
          },
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
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, Dr. {user?.name}!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Today's Patients
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.stats.todayPatients}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Completed Today
                  </p>
                  <p className="text-2xl font-semibold text-green-600">
                    {dashboardData.stats.completedToday}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏰</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Pending Today
                  </p>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {dashboardData.stats.pendingToday}
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
                  <p className="text-sm font-medium text-gray-500">
                    Total Patients
                  </p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {dashboardData.stats.totalPatients}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Today's Schedule
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {dashboardData.todayAppointments.map((appointment) => (
              <li key={appointment.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {appointment.patient.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patient}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.type} • {appointment.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {appointment.status}
                    </span>
                    <button className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
