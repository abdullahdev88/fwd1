import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '' });
  const [editingAvailability, setEditingAvailability] = useState(null);

  // Only fetch data once when user is loaded and approved
  useEffect(() => {
    if (user?.role === 'doctor' && user?.status === 'approved' && !dataLoaded) {
      setLoading(true);
      Promise.all([fetchAppointments(), fetchAvailability()])
        .then(() => {
          setLoading(false);
          setDataLoaded(true);
        })
        .catch(() => {
          setLoading(false);
        });
    } else if (user && user.role === 'doctor' && user.status !== 'approved') {
      setLoading(false);
    }
  }, [user, dataLoaded]);

  // Auto-refresh availability every 30 seconds like patient dashboard
  useEffect(() => {
    if (dataLoaded) {
      const interval = setInterval(() => {
        fetchAvailability();
        fetchAppointments();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [dataLoaded]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctor/availability', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailability(response.data.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const addTimeSlot = () => {
    if (newSlot.startTime && newSlot.endTime) {
      if (newSlot.startTime >= newSlot.endTime) {
        alert('End time must be after start time');
        return;
      }
      setTimeSlots([...timeSlots, { ...newSlot, isBooked: false }]);
      setNewSlot({ startTime: '', endTime: '' });
    }
  };

  const removeTimeSlot = (index) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const saveAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/doctor/availability', {
        date: selectedDate,
        timeSlots
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Availability updated successfully!');
      setShowAvailabilityModal(false);
      setSelectedDate('');
      setTimeSlots([]);
      setEditingAvailability(null);
      // Refresh availability immediately
      await fetchAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error updating availability');
    }
  };

  const deleteAvailability = async (availId) => {
    if (!window.confirm('Are you sure you want to delete this availability date?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/doctor/availability/${availId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Availability deleted successfully!');
      await fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      alert('Error deleting availability');
    }
  };

  const editAvailability = (avail) => {
    setEditingAvailability(avail);
    setSelectedDate(new Date(avail.date).toISOString().split('T')[0]);
    setTimeSlots([...avail.timeSlots]);
    setShowAvailabilityModal(true);
  };

  if (user?.role === 'doctor' && user?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-yellow-500 text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Pending</h2>
          <p className="text-gray-600 mb-4">
            Your doctor account is pending admin approval. You will be notified once approved.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>Status:</strong> Pending Approval
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, Dr. {user?.name}!</p>
          
          {/* Show availability status */}
          {availability.length > 0 && (
            <div className="mt-2 text-sm text-green-600">
              ✅ Your availability is visible to patients ({availability.length} available days)
            </div>
          )}
          {availability.length === 0 && (
            <div className="mt-2 text-sm text-orange-600">
              ⚠️ You have no availability set. Add availability to receive appointments.
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                  <p className="text-2xl font-semibold text-blue-600">{todayAppointments.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-semibold text-green-600">{appointments.length}</p>
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
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-purple-600">
                    {appointments.filter(apt => apt.status === 'completed').length}
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
                  <p className="text-sm font-medium text-gray-500">Available Days</p>
                  <p className="text-2xl font-semibold text-orange-600">{availability.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Availability Management */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Availability
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your available time slots (Auto-updates every 30s)
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={fetchAvailability}
                  className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1 rounded"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add Availability
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {availability.length > 0 ? (
                availability.map((avail) => (
                  <div key={avail._id} className="px-4 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {new Date(avail.date).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {avail.timeSlots.map((slot, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs rounded ${
                                slot.isBooked 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {slot.startTime}-{slot.endTime}
                              {slot.isBooked && ' (Booked)'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 ml-4">
                        <button
                          onClick={() => editAvailability(avail)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAvailability(avail._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  No availability set. Click "Add Availability" to get started.
                </div>
              )}
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Appointments
              </h3>
              <button
                onClick={fetchAppointments}
                className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1 rounded"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="px-4 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.patient.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.patient.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                        </p>
                        {appointment.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Notes: {appointment.notes}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-800'
                          : appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  No appointments yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAvailability ? 'Edit Availability' : 'Add Availability'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={editingAvailability ? true : false}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Time Slots
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={addTimeSlot}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className={slot.isBooked ? 'text-red-600' : 'text-gray-800'}>
                        {slot.startTime} - {slot.endTime}
                        {slot.isBooked && ' (Booked - Cannot Remove)'}
                      </span>
                      {!slot.isBooked && (
                        <button
                          onClick={() => removeTimeSlot(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={saveAvailability}
                  disabled={!selectedDate || timeSlots.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingAvailability ? 'Update Availability' : 'Save Availability'}
                </button>
                <button
                  onClick={() => {
                    setShowAvailabilityModal(false);
                    setSelectedDate('');
                    setTimeSlots([]);
                    setEditingAvailability(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
