import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';
import Navbar from './components/layout/Navbar';
import Login from './pages/auth/Login';
import Signup from './components/Signup';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfileSettings from './pages/ProfileSettings';
import CreateMedicalRecord from './pages/medicalRecords/CreateMedicalRecord';
import MedicalRecordsList from './pages/medicalRecords/MedicalRecordsList';
import MedicalRecordDetail from './pages/medicalRecords/MedicalRecordDetail';
import { ROUTES } from './config/routes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.SIGNUP} element={<Signup />} />

            {/* Patient Routes */}
            <Route
              path={ROUTES.PATIENT.DASHBOARD}
              element={
                <PrivateRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={ROUTES.PATIENT.APPOINTMENTS}
              element={
                <PrivateRoute allowedRoles={['patient']}>
                  <PatientAppointments />
                </PrivateRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path={ROUTES.DOCTOR.DASHBOARD}
              element={
                <PrivateRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </PrivateRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path={ROUTES.ADMIN.DASHBOARD}
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            {/* Profile Route - Available to all authenticated users */}
            <Route
              path={ROUTES.PROFILE}
              element={
                <PrivateRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <ProfileSettings />
                </PrivateRoute>
              }
            />

            {/* Medical Records Routes */}
            {/* Create Medical Record - Doctor only */}
            <Route
              path={ROUTES.MEDICAL_RECORDS.CREATE}
              element={
                <PrivateRoute allowedRoles={['doctor']}>
                  <CreateMedicalRecord />
                </PrivateRoute>
              }
            />
            
            {/* Medical Records List - General */}
            <Route
              path={ROUTES.MEDICAL_RECORDS.LIST}
              element={
                <PrivateRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <MedicalRecordsList />
                </PrivateRoute>
              }
            />
            
            {/* Doctor Medical Records */}
            <Route
              path={ROUTES.MEDICAL_RECORDS.DOCTOR_LIST}
              element={
                <PrivateRoute allowedRoles={['doctor']}>
                  <MedicalRecordsList />
                </PrivateRoute>
              }
            />
            
            {/* Patient Medical Records */}
            <Route
              path={ROUTES.MEDICAL_RECORDS.PATIENT_LIST}
              element={
                <PrivateRoute allowedRoles={['patient']}>
                  <MedicalRecordsList />
                </PrivateRoute>
              }
            />
            
            {/* Admin Medical Records */}
            <Route
              path={ROUTES.MEDICAL_RECORDS.ADMIN_LIST}
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <MedicalRecordsList />
                </PrivateRoute>
              }
            />
            
            {/* Medical Record Detail */}
            <Route
              path={ROUTES.MEDICAL_RECORDS.DETAIL}
              element={
                <PrivateRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <MedicalRecordDetail />
                </PrivateRoute>
              }
            />
            
            {/* Medical Record Edit */}
            <Route
              path={ROUTES.MEDICAL_RECORDS.EDIT}
              element={
                <PrivateRoute allowedRoles={['doctor', 'admin']}>
                  <CreateMedicalRecord />
                </PrivateRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
