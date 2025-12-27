import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import PrescriptionForm from '../../components/doctor/PrescriptionForm';
import PrescriptionList from '../../components/doctor/PrescriptionList';
import PrescriptionView from '../../components/doctor/PrescriptionView';
import ClinicPaymentConfirmation from '../../components/doctor/ClinicPaymentConfirmation';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard State
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  // isInitialLoading sirf pehli baar true hoga, taake baad mein screen blink na kare
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Availability Modal State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '' });
  const [editingAvailability, setEditingAvailability] = useState(null);
  
  // Prescription State
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // --- Data Fetching Logic (Optimized for Background Updates) ---

  const fetchDashboardData = useCallback(async (showLoadingSpinner = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (showLoadingSpinner) {
      setIsInitialLoading(true);
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Dono API calls ek sath
      const [appointmentsRes, availabilityRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/doctor/appointments`, config),
        axios.get(`${API_BASE_URL}/doctor/availability`, config)
      ]);

      // Handle Appointments Data
      let appointmentsData = [];
      const appData = appointmentsRes.data;
      if (Array.isArray(appData)) appointmentsData = appData;
      else if (appData.data && Array.isArray(appData.data)) appointmentsData = appData.data;
      else if (appData.data?.appointments) appointmentsData = appData.data.appointments;
      else if (appData.appointments) appointmentsData = appData.appointments;
      
      setAppointments(appointmentsData);

      // Handle Availability Data
      const availData = availabilityRes.data.data?.availability || availabilityRes.data.data || [];
      setAvailability(availData);

    } catch (error) {
      console.error('Error syncing dashboard:', error);
    } finally {
      // Data aa gaya, loading band kardo
      setIsInitialLoading(false);
    }
  }, []);

  // --- Real-time Effect ---
  useEffect(() => {
    // 1. Page load hotay hi data lao (Spinner dikhao)
    fetchDashboardData(true);

    // 2. Har 5 second baad data refresh karo (Spinner MAT dikhao - Silent Update)
    const interval = setInterval(() => {
      fetchDashboardData(false); 
    }, 5000); // 5 seconds for fast updates

    // Cleanup
    return () => clearInterval(interval);
  }, [fetchDashboardData]);


  // --- Availability Handlers ---

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
    // Validation
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }
    
    if (timeSlots.length === 0) {
      alert('Please add at least one time slot');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log('Saving availability:', { date: selectedDate, timeSlots });
      
      const response = await axios.post(`${API_BASE_URL}/doctor/availability`, {
        date: selectedDate,
        timeSlots
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Availability saved:', response.data);
      
      setSuccessMessage('Availability updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowAvailabilityModal(false);
      setSelectedDate('');
      setTimeSlots([]);
      setEditingAvailability(null);
      fetchDashboardData(false); // Refresh immediately without spinner
    } catch (error) {
      console.error('Error saving availability:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Error updating availability';
      alert(errorMessage);
    }
  };

  const deleteAvailability = async (availId) => {
    if (!window.confirm('Are you sure you want to delete this availability date?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/doctor/availability/${availId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData(false); // Refresh immediately
    } catch (error) {
      console.error('Error deleting availability:', error);
    }
  };

  const editAvailability = (avail) => {
    setEditingAvailability(avail);
    setSelectedDate(new Date(avail.date).toISOString().split('T')[0]);
    setTimeSlots([...avail.timeSlots]);
    setShowAvailabilityModal(true);
  };

  // --- Prescription Handlers ---
  const handleCreatePrescription = () => { setEditingPrescription(null); setShowPrescriptionForm(true); };
  const handleEditPrescription = (prescription) => { setEditingPrescription(prescription); setShowPrescriptionForm(true); };
  const handleViewPrescription = (prescription) => { setSelectedPrescription(prescription); };
  const handlePrescriptionSuccess = (message) => { 
    setSuccessMessage(message); 
    setShowPrescriptionForm(false); 
    setEditingPrescription(null); 
    setTimeout(() => setSuccessMessage(''), 5000); 
  };
  const handleClosePrescriptionForm = () => { setShowPrescriptionForm(false); setEditingPrescription(null); };

  // --- Render Helpers ---
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

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  // --- Main Render ---

  if (user?.role === 'doctor' && user?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-primary))]">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-[rgb(var(--text-heading))] mb-2">Account Pending</h2>
          <div className="badge-warning px-4 py-3 rounded-lg">Status: Pending Approval</div>
        </div>
      </div>
    );
  }

  // Sirf pehli dafa loading dikhayega, phir nahi
  if (isInitialLoading) {
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
        
        {/* Header Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[rgb(var(--text-heading))]">Doctor Dashboard</h1>
              <p className="mt-2 text-[rgb(var(--text-secondary))]">Welcome back, Dr. {user?.name}!</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Live Indicator */}
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">Live Sync Active</span>
              </div>

              <button
                onClick={() => fetchDashboardData(true)} // Manual refresh shows spinner
                className="btn-secondary flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          {successMessage && (
            <div className="mt-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg animate-fade-in">
              {successMessage}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mt-6 border-b-2 border-[rgb(var(--border-color))]">
            <nav className="-mb-px flex space-x-8">
              <TabButton id="dashboard" label="Dashboard" isActive={activeTab === 'dashboard'} onClick={setActiveTab} />
              <TabButton id="payments" label="Payments" isActive={activeTab === 'payments'} onClick={setActiveTab} />
              <TabButton id="prescriptions" label="Prescriptions" isActive={activeTab === 'prescriptions'} onClick={setActiveTab} />
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6 px-4 sm:px-0">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
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
                       <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                
                {/* Availability Section */}
                <div className="card">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">Your Availability</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Manage your available time slots</p>
                    </div>
                    <button onClick={() => setShowAvailabilityModal(true)} className="btn-primary">
                      Add Availability
                    </button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
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
                                  <span key={index} className={`px-2 py-1 text-xs rounded ${slot.isBooked ? 'badge-error' : 'badge-success'}`}>
                                    {slot.startTime}-{slot.endTime}
                                    {slot.isBooked && ' (Booked)'}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col space-y-1 ml-4">
                              <button onClick={() => editAvailability(avail)} className="text-[rgb(var(--accent))] hover:text-blue-400 text-sm font-medium">Edit</button>
                              <button onClick={() => deleteAvailability(avail._id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Delete</button>
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

                {/* Appointments Section */}
                <div className="card">
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-[rgb(var(--text-heading))]">Your Appointments</h3>
                    <span className="text-xs text-[rgb(var(--text-secondary))] animate-pulse">Live Syncing...</span>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {appointments.length > 0 ? (
                      appointments.map((appointment) => (
                        <div key={appointment._id} className="py-4 border-b border-[rgb(var(--border-color))] last:border-0 hover:bg-[rgb(var(--bg-tertiary))] -mx-4 px-4 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-[rgb(var(--text-heading))]">{appointment.patient.name}</p>
                              <p className="text-sm text-[rgb(var(--text-secondary))]">{appointment.patient.email}</p>
                              <p className="text-sm text-[rgb(var(--text-primary))] mt-1">
                                {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                              </p>
                              {appointment.notes && (
                                <p className="text-sm text-[rgb(var(--text-secondary))] mt-1 bg-[rgb(var(--bg-primary))] p-2 rounded">
                                  Notes: {appointment.notes}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              appointment.status === 'scheduled' ? 'badge-info' : 
                              appointment.status === 'completed' ? 'badge-success' : 'badge-error'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[rgb(var(--text-secondary))]">No appointments yet</div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <ClinicPaymentConfirmation />
            </div>
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

        {/* Prescription View Modal */}
        {selectedPrescription && (
          <PrescriptionView
            prescription={selectedPrescription}
            onClose={() => setSelectedPrescription(null)}
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
                <label className="label">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={!!editingAvailability}
                  className="input-field disabled:opacity-50"
                />
              </div>

              <div className="mb-4">
                <label className="label">Add Time Slots</label>
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
                  <button onClick={addTimeSlot} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                    Add
                  </button>
                </div>
                
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex justify-between items-center bg-[rgb(var(--bg-tertiary))] p-2 rounded">
                      <span className={slot.isBooked ? 'text-red-400' : 'text-[rgb(var(--text-primary))]'}>
                        {slot.startTime} - {slot.endTime}
                        {slot.isBooked && ' (Booked)'}
                      </span>
                      {!slot.isBooked && (
                        <button onClick={() => removeTimeSlot(index)} className="text-red-400 hover:text-red-300">Remove</button>
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
    </div>
  );
};

export default DoctorDashboard;