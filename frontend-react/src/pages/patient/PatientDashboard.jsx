import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    
    // Refresh doctors every 30 seconds to show latest availability
    const interval = setInterval(() => {
      fetchDoctors();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/patient/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const doctorsData = response.data.data || [];
        // Filter doctors with actual available slots
        const availableDoctors = doctorsData.filter(doctor => 
          doctor.availability && doctor.availability.length > 0 && 
          doctor.availability.some(avail => avail.timeSlots && avail.timeSlots.length > 0)
        );
        setDoctors(availableDoctors);
      } else {
        setError('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError(error.response?.data?.message || 'Failed to fetch doctors');
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post('http://localhost:5000/api/patient/book-appointment', {
        doctorId: selectedDoctor._id,
        dateId: selectedSlot.dateId,
        slotIndex: selectedSlot.slotIndex,
        notes: bookingNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Appointment booked successfully!');
        setBookingModal(false);
        setBookingNotes('');
        setSelectedDoctor(null);
        setSelectedSlot(null);
        
        // Refresh data
        await Promise.all([fetchDoctors(), fetchAppointments()]);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(error.response?.data?.message || 'Error booking appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const openBookingModal = (doctor, date, slotIndex, slot) => {
    setSelectedDoctor(doctor);
    setSelectedSlot({
      dateId: date._id,
      slotIndex,
      date: date.date,
      time: `${slot.startTime} - ${slot.endTime}`
    });
    setBookingModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
          
          {/* Show real-time status */}
          {doctors.length > 0 && (
            <div className="mt-2 text-sm text-green-600">
              🟢 {doctors.length} doctor(s) currently available for appointments
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{appointments.length}</p>
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
                  <p className="text-sm font-medium text-gray-500">Upcoming</p>
                  <p className="text-2xl font-semibold text-green-600">{upcomingAppointments.length}</p>
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
                  <p className="text-sm font-medium text-gray-500">Available Doctors</p>
                  <p className="text-2xl font-semibold text-blue-600">{doctors.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Doctors */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Available Doctors
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Book appointments with approved doctors (Updates every 30 seconds)
              </p>
            </div>
            <button
              onClick={fetchDoctors}
              className="text-sm bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded"
            >
              🔄 Refresh
            </button>
          </div>
          
          {doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">Dr.</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-medium text-gray-900">{doctor.name}</h4>
                      <p className="text-sm text-gray-500">{doctor.specialization}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <p>Experience: {doctor.experience} years</p>
                    <p>Education: {doctor.education}</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Available Slots:</h5>
                    {doctor.availability && doctor.availability.length > 0 ? (
                      doctor.availability.map((date) => (
                        <div key={date._id} className="border-l-4 border-blue-500 pl-3">
                          <p className="font-medium text-sm">
                            {new Date(date.date).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {date.timeSlots.map((slot, slotIndex) => (
                              <button
                                key={slotIndex}
                                onClick={() => openBookingModal(doctor, date, slotIndex, slot)}
                                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                              >
                                {slot.startTime}-{slot.endTime}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No available slots</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {error ? 'Failed to load doctors' : 'No approved doctors available at the moment'}
            </div>
          )}
        </div>

        {/* Your Appointments */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Appointments
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <li key={appointment._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.doctor.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.doctor.specialization}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-400 mt-1">
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
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-center text-gray-500">
                No appointments booked yet
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal && selectedDoctor && selectedSlot && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Book Appointment
              </h3>
              
              <div className="space-y-3 mb-4">
                <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
                <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
                <p><strong>Date:</strong> {new Date(selectedSlot.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {selectedSlot.time}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any specific concerns or notes..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBookAppointment}
                  disabled={bookingLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button
                  onClick={() => {
                    setBookingModal(false);
                    setSelectedDoctor(null);
                    setSelectedSlot(null);
                    setBookingNotes('');
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

export default PatientDashboard;
