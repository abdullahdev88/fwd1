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
    APPOINTMENTS: '/admin/appointments'
  }
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
