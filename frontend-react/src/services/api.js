import axios from 'axios';

// Base URL for backend API - configurable via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Profile API calls
export const profileAPI = {
  getMyProfile: () => api.get('/profile/me'),
  updateMyProfile: (data) => api.put('/profile/update', data),
  uploadProfilePicture: (data) => api.post('/profile/upload-picture', data),
};

// Admin Profile API calls
export const adminProfileAPI = {
  getUserProfile: (id) => api.get(`/admin/profile/${id}`),
  updateUserProfile: (id, data) => api.put(`/admin/profile/${id}`, data),
};

// Medical Records API calls
export const medicalRecordsAPI = {
  // Create new medical record (Doctor only)
  createRecord: (data) => api.post('/medical-records', data),
  
  // Get patient's own records (Patient only)
  getMyRecords: () => api.get('/medical-records/me'),
  
  // Get doctor's created records (Doctor only)
  getDoctorRecords: () => api.get('/medical-records/doctor/my-records'),
  
  // Get all records (Admin only)
  getAllRecords: (page = 1, limit = 20) => api.get(`/medical-records/admin/all?page=${page}&limit=${limit}`),
  
  // Get specific patient's records (Doctor + Admin)
  getPatientRecords: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  
  // Get single record by ID
  getRecordById: (recordId) => api.get(`/medical-records/${recordId}`),
  
  // Update medical record (Doctor own + Admin)
  updateRecord: (recordId, data) => api.put(`/medical-records/${recordId}`, data),
  
  // Delete medical record (Admin only)
  deleteRecord: (recordId) => api.delete(`/medical-records/${recordId}`)
};

// Patient API calls
export const patientAPI = {
  getDashboard: () => api.get('/patient/dashboard'),
  getAppointments: () => api.get('/patient/appointments'),
  bookAppointment: (data) => api.post('/patient/appointments', data),
  getPrescriptions: () => api.get('/patient/prescriptions'),
};

// Doctor API calls
export const doctorAPI = {
  getDashboard: () => api.get('/doctor/dashboard'),
  getAppointments: (params) => api.get('/doctor/appointments', { params }),
  updateAppointment: (id, data) => api.put(`/doctor/appointments/${id}`, data),
  createPrescription: (data) => api.post('/doctor/prescriptions', data),
  updateAvailability: (data) => api.put('/doctor/availability', data),
};

// Admin API calls
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createAdmin: (data) => api.post('/admin/users/create-admin', data),
};

export default api;
