import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ROUTES } from "../../config/routes";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <nav className="bg-[rgb(var(--bg-secondary))] border-b-2 border-[rgb(var(--border-color))] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-[rgb(var(--accent))] hover:text-blue-400 transition-colors">
                MyClinic.pk
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                aria-label="Toggle theme"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[rgb(var(--text-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <Link
                to="/login"
                className="text-[rgb(var(--text-primary))] hover:text-[rgb(var(--accent))] px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
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
      { name: 'My Appointments', path: ROUTES.PATIENT.APPOINTMENTS },
      { name: 'Book Appointment', path: ROUTES.APPOINTMENTS.BOOK },
      { name: 'Second Opinion', path: ROUTES.SECOND_OPINIONS.MY_REQUESTS },
      { name: 'Medical Records', path: ROUTES.MEDICAL_RECORDS.PATIENT_LIST }
    ],
    doctor: [
      { name: 'Dashboard', path: ROUTES.DOCTOR.DASHBOARD },
      { name: 'Appointment Requests', path: ROUTES.APPOINTMENTS.DOCTOR_REQUESTS },
      { name: 'Medical Records', path: ROUTES.MEDICAL_RECORDS.DOCTOR_LIST },
      { name: 'Second Opinion Requests', path: ROUTES.SECOND_OPINIONS.DOCTOR_CASES }
    ],
    admin: [
      { name: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD },
      { name: 'Medical Records', path: ROUTES.MEDICAL_RECORDS.LIST }
    ]
  };

  const links = dashboardLinks[user.role] || [];

  return (
    <nav className="bg-[rgb(var(--bg-secondary))] border-b-2 border-[rgb(var(--border-color))] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-10">
            <Link to={links[0]?.path || '/'} className="text-xl font-bold text-[rgb(var(--accent))] hover:text-blue-400 transition-colors">
              MyClinic.pk
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'bg-[rgb(var(--accent))] text-white shadow-sm'
                      : 'text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] hover:text-[rgb(var(--accent))]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Right Side Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-[rgb(var(--bg-tertiary))]">
              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {user.name}
              </span>
              <span className="badge badge-info text-xs">
                {user.role.toUpperCase()}
              </span>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[rgb(var(--text-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Profile Link */}
            <Link
              to="/profile"
              className="p-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--accent))] rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
              title="Profile Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn-danger"
            >
              Logout
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t-2 border-[rgb(var(--border-color))]">
            <div className="px-3 py-2 mb-3 bg-[rgb(var(--bg-tertiary))] rounded-lg">
              <p className="text-sm font-medium text-[rgb(var(--text-heading))]">{user.name}</p>
              <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">{user.role.toUpperCase()}</p>
            </div>

            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  location.pathname === link.path
                    ? 'bg-[rgb(var(--accent))] text-white'
                    : 'text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-3 mt-3 space-y-2 border-t-2 border-[rgb(var(--border-color))]">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md text-sm font-medium text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]"
              >
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
