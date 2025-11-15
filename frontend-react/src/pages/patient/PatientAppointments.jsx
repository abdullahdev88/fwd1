import React, { useState, useEffect } from 'react';
import { patientAPI, doctorAPI } from '../../services/api';

// Patient Appointments page - View and book appointments
const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    appointmentDate: '',
    timeSlot: {
      startTime: '',
      endTime: '',
    },
    symptoms: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAppointments();
      setAppointments(response.data.data.appointments);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      // Fetch all users with doctor role
      const response = await patientAPI.getDoctors?.() || { data: { data: { users: [] } } };
      setDoctors(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await patientAPI.bookAppointment(bookingForm);
      alert('Appointment booked successfully!');
      setShowBookingModal(false);
      setBookingForm({
        doctorId: '',
        appointmentDate: '',
        timeSlot: { startTime: '', endTime: '' },
        symptoms: '',
      });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="mt-2 text-gray-600">View and manage your appointments</p>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="btn-primary"
          >
            Book New Appointment
          </button>
        </div>

        {/* Appointments List */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">All Appointments</h2>
          {appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symptoms
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.doctor?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.doctor?.specialization}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.timeSlot?.startTime} - {appointment.timeSlot?.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {appointment.symptoms || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No appointments found</p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="btn-primary"
              >
                Book Your First Appointment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Book New Appointment</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="label">Select Doctor</label>
                <select
                  required
                  className="input-field"
                  value={bookingForm.doctorId}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, doctorId: e.target.value })
                  }
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Appointment Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingForm.appointmentDate}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, appointmentDate: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={bookingForm.timeSlot.startTime}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        timeSlot: { ...bookingForm.timeSlot, startTime: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={bookingForm.timeSlot.endTime}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        timeSlot: { ...bookingForm.timeSlot, endTime: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label">Symptoms / Reason for Visit</label>
                <textarea
                  rows="3"
                  className="input-field"
                  placeholder="Describe your symptoms..."
                  value={bookingForm.symptoms}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, symptoms: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
