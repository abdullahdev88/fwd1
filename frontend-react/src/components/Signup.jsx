import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from './common/Input';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phone: '',
    specialization: '',
    experience: '',
    education: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'doctor') {
      if (!formData.specialization || !formData.experience || !formData.education) {
        setError('Please fill all doctor details');
        return;
      }
    }

    setLoading(true);

    try {
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      };

      if (formData.role === 'doctor') {
        dataToSend.specialization = formData.specialization;
        dataToSend.experience = parseInt(formData.experience);
        dataToSend.education = formData.education;
      }

      const result = await signup(dataToSend);

      if (result.success) {
        if (result.requiresApproval) {
          // Doctor signup - show approval message
          setSuccess(result.message);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          // Patient signup - redirect to login
          navigate('/login', { 
            state: { message: 'Account created successfully! Please login.' }
          });
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                  <p className="text-xs text-green-600 mt-1">Redirecting to login page...</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {formData.role === 'doctor' && (
              <>
                <Input
                  label="Specialization"
                  name="specialization"
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Cardiologist, Neurologist"
                />

                <Input
                  label="Years of Experience"
                  name="experience"
                  type="number"
                  required
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Years of experience"
                  min="0"
                />

                <Input
                  label="Education"
                  name="education"
                  type="text"
                  required
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="e.g., MBBS, MD"
                />
              </>
            )}

            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 6 characters)"
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
