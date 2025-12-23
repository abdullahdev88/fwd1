import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import PatientPrescriptionList from '../../components/patient/PatientPrescriptionList';
import PrescriptionView from '../../components/doctor/PrescriptionView';

const TabButton = ({ id, label, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      isActive
        ? 'bg-[rgb(var(--accent))] text-white shadow-sm'
        : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
    }`}
  >
    {label}
  </button>
);

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
  
  // Prescription state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const upcomingAppointments = appointments.filter(app => 
    new Date(app.appointmentDate) >= new Date() && app.status === 'scheduled'
  );

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    
    // Refresh doctors and appointments every 30 seconds to show latest data
    const interval = setInterval(() => {
      fetchDoctors();
      fetchAppointments();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/patient/doctors', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && response.data.data) {
        setDoctors(response.data.data.doctors || []);
        setError('');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError(error.response?.data?.message || 'Failed to fetch doctors');
      setDoctors([]);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/patient/appointments', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Appointments response:', response.data);
      
      if (response.data && response.data.data) {
        const appointmentsData = response.data.data.appointments || response.data.data || [];
        console.log('Setting appointments:', appointmentsData);
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    
    setBookingLoading(true);
    try {
      const bookingData = {
        doctorId: selectedDoctor._id,
        dateId: selectedSlot.dateId,
        slotIndex: selectedSlot.slotIndex,
        notes: bookingNotes
      };

      const response = await axios.post('/api/patient/appointments', bookingData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        alert('Appointment booked successfully!');
        setBookingModal(false);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setBookingNotes('');
      
        // Refresh appointments to show updated count
        fetchAppointments();
        fetchDoctors();
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

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const handleClosePrescriptionView = () => {
    setSelectedPrescription(null);
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
        {/* Header with Tab Navigation */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">Patient Dashboard</h1>
              <p className="mt-2 text-[rgb(var(--text-secondary))]">Welcome back, {user?.name}!</p>
            </div>
            <button
              onClick={() => {
                fetchAppointments();
                fetchDoctors();
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="mt-6 border-b-2 border-[rgb(var(--border-color))]">
            <nav className="-mb-px flex space-x-8">
              <TabButton
                id="dashboard"
                label="Dashboard"
                isActive={activeTab === 'dashboard'}
                onClick={setActiveTab}
              />
              <TabButton
                id="prescriptions"
                label="My Prescriptions"
                isActive={activeTab === 'prescriptions'}
                onClick={setActiveTab}
              />
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-0">
          {activeTab === 'dashboard' && (
            <div>
              {/* Show real-time status */}
              {doctors.length > 0 && (
                <div className="mt-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-400 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="5" />
                    </svg>
                    {doctors.length} doctor(s) currently available for appointments
                  </p>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total Appointments</p>
                      <p className="text-2xl font-semibold text-[rgb(var(--text-heading))]">{appointments.length}</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Upcoming</p>
                      <p className="text-2xl font-semibold text-emerald-400">{upcomingAppointments.length}</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Available Doctors</p>
                      <p className="text-2xl font-semibold text-[rgb(var(--accent))]">{doctors.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Doctors */}
              <div className="card mb-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">Available Doctors</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                      Book appointments with approved doctors (Updates every 30 seconds)
                    </p>
                  </div>
                  <button
                    onClick={fetchDoctors}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
                
                {doctors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doctor) => (
                      <div key={doctor._id} className="card hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-3">
                          <div className="h-12 w-12 rounded-full bg-[rgb(var(--accent))]/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-lg font-medium text-[rgb(var(--text-heading))]">{doctor.name}</h4>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">{doctor.specialization}</p>
                          </div>
                        </div>

                        <div className="text-sm text-[rgb(var(--text-primary))] mb-3 space-y-1">
                          <p>Experience: {doctor.experience} years</p>
                          <p>Education: {doctor.education}</p>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-medium text-[rgb(var(--text-heading))]">Available Slots:</h5>
                          {doctor.availability && doctor.availability.length > 0 ? (
                            doctor.availability.map((date) => (
                              <div key={date._id} className="border-l-4 border-[rgb(var(--accent))] pl-3 py-1">
                                <p className="font-medium text-sm text-[rgb(var(--text-primary))]">
                                  {new Date(date.date).toLocaleDateString()}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {date.timeSlots.map((slot, slotIndex) => (
                                    <button
                                      key={slotIndex}
                                      onClick={() => openBookingModal(doctor, date, slotIndex, slot)}
                                      className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors"
                                    >
                                      {slot.startTime}-{slot.endTime}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-[rgb(var(--text-secondary))]">No available slots</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-[rgb(var(--text-secondary))]">
                    {error ? 'Failed to load doctors' : 'No approved doctors available at the moment'}
                  </div>
                )}
              </div>

              {/* Your Appointments */}
              <div className="card">
                <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))] mb-4">Your Appointments</h3>
                <ul className="divide-y divide-[rgb(var(--border-color))]">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <li key={appointment._id} className="py-4 hover:bg-[rgb(var(--bg-tertiary))] -mx-6 px-6 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-[rgb(var(--text-heading))]">
                              {appointment.doctor.name}
                            </p>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                              {appointment.doctor.specialization}
                            </p>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                            </p>
                            {appointment.notes && (
                              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                                Notes: {appointment.notes}
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'scheduled' 
                              ? 'badge badge-info'
                              : appointment.status === 'completed'
                              ? 'badge-success'
                              : 'badge-error'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-6 text-center text-[rgb(var(--text-secondary))]">
                      No appointments booked yet
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="mt-6">
              <PatientPrescriptionList onViewPrescription={handleViewPrescription} />
            </div>
          )}
        </div>

        {/* Prescription View Modal */}
        {selectedPrescription && (
          <PrescriptionView
            prescription={selectedPrescription}
            onClose={handleClosePrescriptionView}
            userRole={user?.role}
          />
        )}

        {/* Booking Modal */}
        {bookingModal && selectedDoctor && selectedSlot && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-6 border-2 border-[rgb(var(--border-color))] w-96 shadow-2xl rounded-lg bg-[rgb(var(--bg-secondary))]">
              <h3 className="text-lg font-medium text-[rgb(var(--text-heading))] mb-6">
                Book Appointment
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Doctor
                </label>
                <p className="text-sm text-[rgb(var(--text-primary))]">Dr. {selectedDoctor.name}</p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">{selectedDoctor.specialization}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Date & Time
                </label>
                <p className="text-sm text-[rgb(var(--text-primary))]">
                  {new Date(selectedSlot.date).toLocaleDateString()} at {selectedSlot.time}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Any specific symptoms or concerns..."
                  className="input-field"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="btn-primary flex-1"
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
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
