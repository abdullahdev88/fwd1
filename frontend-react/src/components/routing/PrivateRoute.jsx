import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.toLowerCase();
  const allowed = allowedRoles.map(r => r.toLowerCase());

  if (!allowed.includes(userRole)) {
    console.log(`🚫 Role ${userRole} not allowed, redirecting to own dashboard`);
    const dashboards = {
      'patient': '/patient/dashboard',
      'doctor': '/doctor/dashboard',
      'admin': '/admin/dashboard'
    };
    return <Navigate to={dashboards[userRole] || '/login'} replace />;
  }

  console.log(`✅ Access granted for role: ${userRole}`);
  return children;
};

export default PrivateRoute;
