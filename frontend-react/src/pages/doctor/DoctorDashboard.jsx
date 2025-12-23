import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import PrescriptionForm from '../../components/doctor/PrescriptionForm';
import PrescriptionList from '../../components/doctor/PrescriptionList';
import PrescriptionView from '../../components/doctor/PrescriptionView';

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
  
  // Prescription state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch data immediately when user is loaded and approved
  useEffect(() => {
    if (user?.role === 'doctor' && user?.status === 'approved') {
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
  }, [user]);

  // Auto-refresh availability and appointments every 30 seconds
  useEffect(() => {
    if (dataLoaded) {
      const interval = setInterval(async () => {
        await Promise.all([fetchAvailability(), fetchAppointments()]);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [dataLoaded]);

  // Manual refresh function (not used in UI but kept for future)
  const handleRefresh = async () => {
    await Promise.all([fetchAppointments(), fetchAvailability()]);
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching appointments for doctor...');
      const response = await axios.get('http://localhost:5000/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Doctor appointments FULL response:', response);
      console.log('Doctor appointments response.data:', response.data);
      
      // Try multiple possible response structures
      let appointmentsData = [];
      
      if (Array.isArray(response.data)) {
        appointmentsData = response.data;
      } else if (response.data.data) {
        if (Array.isArray(response.data.data)) {
          appointmentsData = response.data.data;
        } else if (response.data.data.appointments) {
          appointmentsData = response.data.data.appointments;
        }
      } else if (response.data.appointments) {
        appointmentsData = response.data.appointments;
      }
      
      console.log('Final appointments data to set:', appointmentsData);
      console.log('Number of appointments:', appointmentsData.length);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Error response:', error.response);
      setAppointments([]);
    }
  };

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctor/availability', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Doctor availability response:', response.data);
      const availabilityData = response.data.data?.availability || response.data.data || [];
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability([]);
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

  // Prescription handlers
  const handleCreatePrescription = () => {
    setEditingPrescription(null);
    setShowPrescriptionForm(true);
  };

  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    setShowPrescriptionForm(true);
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const handlePrescriptionSuccess = (message) => {
    setSuccessMessage(message);
    setShowPrescriptionForm(false);
    setEditingPrescription(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleClosePrescriptionForm = () => {
    setShowPrescriptionForm(false);
    setEditingPrescription(null);
  };

  const handleClosePrescriptionView = () => {
    setSelectedPrescription(null);
  };

  if (user?.role === 'doctor' && user?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-primary))]">
        <div className="card max-w-md text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-[rgb(var(--text-heading))] mb-2">Account Pending</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-4">
            Your doctor account is pending admin approval. You will be notified once approved.
          </p>
          <div className="badge-warning px-4 py-3 rounded-lg">
            <p className="text-sm">
              <strong>Status:</strong> Pending Approval
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

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

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">Doctor Dashboard</h1>
          <p className="mt-2 text-[rgb(var(--text-secondary))]">Welcome back, Dr. {user?.name}!</p>
          
          {successMessage && (
            <div className="mt-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Tab Navigation */}
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
                label="Prescriptions"
                isActive={activeTab === 'prescriptions'}
                onClick={setActiveTab}
              />
            </nav>
          </div>
          
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Show availability status */}
              {availability.length > 0 && (
                <div className="mb-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-400 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="5" />
                    </svg>
                    Your availability is visible to patients ({availability.length} available days)
                  </p>
                </div>
              )}
              {availability.length === 0 && (
                <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400 flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    You have no availability set. Add availability to receive appointments.
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Today's Appointments</p>
                      <p className="text-2xl font-semibold text-[rgb(var(--text-heading))]">{todayAppointments.length}</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total Appointments</p>
                      <p className="text-2xl font-semibold text-emerald-400">{appointments.length}</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Completed</p>
                      <p className="text-2xl font-semibold text-purple-400">
                        {appointments.filter(apt => apt.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Available Days</p>
                      <p className="text-2xl font-semibold text-amber-400">{availability.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Availability Management */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">
                  Your Availability
                </h3>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Manage your available time slots
                </p>
              </div>
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="btn-primary"
              >
                Add Availability
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {availability.length > 0 ? (
                availability.map((avail) => (
                  <div key={avail._id} className="py-3 border-b border-[rgb(var(--border-color))] last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-[rgb(var(--text-heading))]">
                          {new Date(avail.date).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {avail.timeSlots.map((slot, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs rounded ${
                                slot.isBooked 
                                  ? 'badge-error' 
                                  : 'badge-success'
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
                          className="text-[rgb(var(--accent))] hover:text-blue-400 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAvailability(avail._id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[rgb(var(--text-secondary))]">
                  No availability set. Click "Add Availability" to get started.
                </div>
              )}
            </div>
          </div>

          {/* Appointments */}
          <div className="card">
            <div className="mb-6">
              <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">
                Your Appointments
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="py-4 border-b border-[rgb(var(--border-color))] last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[rgb(var(--text-heading))]">
                          {appointment.patient.name}
                        </p>
                        <p className="text-sm text-[rgb(var(--text-secondary))]">
                          {appointment.patient.email}
                        </p>
                        <p className="text-sm text-[rgb(var(--text-primary))]">
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
                          ? 'badge-info'
                          : appointment.status === 'completed'
                          ? 'badge-success'
                          : 'badge-error'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[rgb(var(--text-secondary))]">
                  No appointments yet
                </div>
              )}
            </div>
          </div>
        </div>
              </>
            )}

            {activeTab === 'prescriptions' && (
              <div className="space-y-6">
                {showPrescriptionForm ? (
                  <PrescriptionForm
                    onSuccess={handlePrescriptionSuccess}
                    onCancel={handleClosePrescriptionForm}
                    editMode={!!editingPrescription}
                    existingPrescription={editingPrescription}
                  />
                ) : (
                  <PrescriptionList
                    onViewPrescription={handleViewPrescription}
                    onEditPrescription={handleEditPrescription}
                    onCreateNew={handleCreatePrescription}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prescription View Modal */}
        {selectedPrescription && (
          <PrescriptionView
            prescription={selectedPrescription}
            onClose={handleClosePrescriptionView}
            onEdit={handleEditPrescription}
            userRole={user?.role}
          />
        )}

        {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border-2 border-[rgb(var(--border-color))] w-96 shadow-2xl rounded-lg bg-[rgb(var(--bg-secondary))]">
            <h3 className="text-lg font-medium text-[rgb(var(--text-heading))] mb-4">
              {editingAvailability ? 'Edit Availability' : 'Add Availability'}
            </h3>
            
            <div className="mb-4">
              <label className="label">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={editingAvailability ? true : false}
                className="input-field disabled:opacity-50"
              />
            </div>

            <div className="mb-4">
              <label className="label">
                Add Time Slots
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                  className="input-field flex-1"
                />
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                  className="input-field flex-1"
                />
                <button
                  onClick={addTimeSlot}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex justify-between items-center bg-[rgb(var(--bg-tertiary))] p-2 rounded">
                    <span className={slot.isBooked ? 'text-red-400' : 'text-[rgb(var(--text-primary))]]'}>
                      {slot.startTime} - {slot.endTime}
                      {slot.isBooked && ' (Booked - Cannot Remove)'}
                    </span>
                    {!slot.isBooked && (
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-400 hover:text-red-300"
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
                className="btn-primary flex-1"
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
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
