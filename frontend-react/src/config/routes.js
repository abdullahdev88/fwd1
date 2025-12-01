// Centralized routing configuration

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  
  PATIENT: {
    DASHBOARD: '/patient/dashboard',
    APPOINTMENTS: '/patient/appointments',
    PROFILE: '/patient/profile'
  },
  
  DOCTOR: {
    DASHBOARD: '/doctor/dashboard',
    APPOINTMENTS: '/doctor/appointments',
    PATIENTS: '/doctor/patients',
    PROFILE: '/doctor/profile'
  },
  
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    DOCTORS: '/admin/doctors',
    PATIENTS: '/admin/patients',
    APPOINTMENTS: '/admin/appointments',
    PROFILE: '/admin/profile'
  },
  
  // Medical Records routes
  MEDICAL_RECORDS: {
    LIST: '/medical-records',
    CREATE: '/doctor/medical-records/create',
    DETAIL: '/medical-records/:id',
    EDIT: '/medical-records/:id/edit',
    DOCTOR_LIST: '/doctor/medical-records',
    PATIENT_LIST: '/patient/medical-records',
    ADMIN_LIST: '/admin/medical-records'
  },

  // Appointment routes
  APPOINTMENTS: {
    BOOK: '/appointments/book',
    PATIENT_LIST: '/patient/appointments',
    DOCTOR_REQUESTS: '/doctor/appointment-requests',
    ADMIN_LIST: '/admin/appointments'
  },
  
  // Prescription routes
  PRESCRIPTIONS: {
    DOCTOR_LIST: '/doctor/prescriptions',
    DOCTOR_CREATE: '/doctor/prescriptions/create',
    PATIENT_LIST: '/patient/prescriptions',
    ADMIN_LIST: '/admin/prescriptions'
  },

  // Common routes
  PROFILE: '/profile'
};

// Role-based dashboard redirects
export const getRoleDashboard = (role) => {
  switch (role?.toLowerCase()) {
    case 'patient':
      return ROUTES.PATIENT.DASHBOARD;
    case 'doctor':
      return ROUTES.DOCTOR.DASHBOARD;
    case 'admin':
      return ROUTES.ADMIN.DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
};

// Check if route is accessible by role
export const canAccessRoute = (route, userRole) => {
  if (!userRole) return false;
  
  if (route.startsWith('/patient') && userRole === 'patient') return true;
  if (route.startsWith('/doctor') && userRole === 'doctor') return true;
  if (route.startsWith('/admin') && userRole === 'admin') return true;
  
  return false;
};
