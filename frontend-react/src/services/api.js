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
      // Force reload to trigger authentication check
      setTimeout(() => {
        window.location.reload();
      }, 100);
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

// Appointment API calls
export const appointmentAPI = {
  // Patient functions
  bookAppointment: (data) => api.post('/appointments/book', data),
  uploadMedicalReports: (appointmentId, formData) => {
    return api.post(`/appointments/${appointmentId}/upload-reports`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMyAppointments: () => api.get('/appointments/my-appointments'),
  getAvailableDoctors: () => api.get('/appointments/available-doctors'),
  
  // Doctor functions
  getDoctorRequests: (status = 'pending') => api.get(`/appointments/doctor-requests?status=${status}`),
  getDoctorAppointments: () => api.get('/appointments/doctor-appointments'),
  approveAppointment: (appointmentId, notes, consultationFee) => api.put(`/appointments/${appointmentId}/approve`, { notes, consultationFee }),
  rejectAppointment: (appointmentId, rejectionReason) => api.put(`/appointments/${appointmentId}/reject`, { rejectionReason }),
  
  // Admin functions
  getAllAppointments: (status, page = 1, limit = 20) => {
    let url = `/appointments/admin/all?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  }
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

// Prescription API calls
export const prescriptionAPI = {
  // Doctor functions
  createPrescription: (data) => api.post('/prescriptions', data),
  getDoctorPrescriptions: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.patientName) queryParams.append('patientName', params.patientName);
    
    const queryString = queryParams.toString();
    return api.get(`/doctor/prescriptions${queryString ? `?${queryString}` : ''}`);
  },
  updatePrescription: (prescriptionId, data) => api.put(`/prescriptions/${prescriptionId}`, data),
  
  // Patient functions
  getMyPrescriptions: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    return api.get(`/prescriptions/me${queryString ? `?${queryString}` : ''}`);
  },
  
  // Shared functions (with permission checks on backend)
  getPrescriptionById: (prescriptionId) => api.get(`/prescriptions/${prescriptionId}`),
  getPrescriptionByAppointment: (appointmentId) => api.get(`/prescriptions/appointment/${appointmentId}`),
  
  // Admin functions
  getAllPrescriptions: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.doctorName) queryParams.append('doctorName', params.doctorName);
    if (params.patientName) queryParams.append('patientName', params.patientName);
    
    const queryString = queryParams.toString();
    return api.get(`/prescriptions${queryString ? `?${queryString}` : ''}`);
  },
  getPatientPrescriptions: (patientId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    return api.get(`/prescriptions/patient/${patientId}${queryString ? `?${queryString}` : ''}`);
  },
  deletePrescription: (prescriptionId) => api.delete(`/prescriptions/${prescriptionId}`),
};

// Admin API calls
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createAdmin: (data) => api.post('/admin/users/create-admin', data),
  getPrescriptions: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return api.get(`/admin/prescriptions${queryString ? `?${queryString}` : ''}`);
  },
};

// Second Opinion API calls (Feature 2)
export const secondOpinionAPI = {
  // Patient functions
  submitRequest: (formData) => {
    return api.post('/second-opinions/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMyRequests: () => api.get('/second-opinions/my-requests'),
  getRequestDetails: (requestId) => api.get(`/second-opinions/${requestId}`),
  cancelRequest: (requestId) => api.put(`/second-opinions/${requestId}/cancel`),

  // Doctor functions
  getPendingRequests: () => api.get('/second-opinions/doctor/pending'),
  getMyCases: (status) => {
    let url = '/second-opinions/doctor/my-cases';
    if (status) url += `?status=${status}`;
    return api.get(url);
  },
  getCaseDetails: (requestId) => api.get(`/second-opinions/doctor/${requestId}`),
  acceptRequest: (requestId) => api.put(`/second-opinions/doctor/${requestId}/accept`),
  startReview: (requestId) => api.put(`/second-opinions/doctor/${requestId}/start-review`),
  submitOpinion: (requestId, opinionData) => {
    return api.put(`/second-opinions/doctor/${requestId}/submit-opinion`, opinionData);
  },
};

// Payment API calls
export const paymentAPI = {
  processPayment: (data) => api.post('/payments/process', data),
  getPaymentHistory: () => api.get('/payments/patient/history'),
  getPaymentByAppointment: (appointmentId) => api.get(`/payments/appointment/${appointmentId}`),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
  requestRefund: (paymentId, data) => api.post(`/payments/${paymentId}/refund-request`, data),
  
  // Admin APIs
  getAllPayments: (params) => api.get('/payments/admin/all', { params }),
  getPaymentStatistics: () => api.get('/payments/admin/statistics'),
  getRefundRequests: () => api.get('/payments/admin/refund-requests'),
  processRefund: (paymentId, data) => api.put(`/payments/admin/${paymentId}/process-refund`, data),
  rejectRefund: (paymentId, data) => api.put(`/payments/admin/${paymentId}/reject-refund`, data),
  
  // Invoice APIs
  generateInvoice: (paymentId) => api.post(`/invoices/generate/${paymentId}`),
  downloadInvoice: (invoiceNumber) => `${API_BASE_URL.replace('/api', '')}/api/invoices/download/${invoiceNumber}`,
  viewInvoice: (invoiceNumber) => `${API_BASE_URL.replace('/api', '')}/api/invoices/view/${invoiceNumber}`,
};

export default api;
