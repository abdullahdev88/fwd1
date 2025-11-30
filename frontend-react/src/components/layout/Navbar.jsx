import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../config/routes";

// Navbar component with role-based navigation
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                MyClinic.pk
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) return null;

  const dashboardLinks = {
    patient: [
      { name: 'Dashboard', path: ROUTES.PATIENT.DASHBOARD },
      { name: 'Appointments', path: ROUTES.PATIENT.APPOINTMENTS },
      { name: 'Medical Records', path: ROUTES.MEDICAL_RECORDS.PATIENT_LIST }
    ],
    doctor: [
      { name: 'Dashboard', path: ROUTES.DOCTOR.DASHBOARD },
      { name: 'Appointments', path: '/doctor/appointments' },
      { name: 'Medical Records', path: ROUTES.MEDICAL_RECORDS.DOCTOR_LIST },
      { name: 'Create Record', path: ROUTES.MEDICAL_RECORDS.CREATE }
    ],
    admin: [
      { name: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD },
      { name: 'Users', path: '/admin/users' },
      { name: 'Medical Records', path: ROUTES.MEDICAL_RECORDS.ADMIN_LIST },
      { name: 'Reports', path: '/admin/reports' }
    ]
  };

  const links = dashboardLinks[user.role] || [];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              MyClinic.pk
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === link.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {user.name}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {user.role.toUpperCase()}
            </span>
            
            {/* Profile Icon */}
            <Link
              to="/profile"
              className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
              title="Profile Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
