import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import ErrorMessage from '../../components/common/ErrorMessage'

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'patient',
    password: '',
    confirmPassword: '',
    // Doctor-specific fields
    specialization: '',
    experience: '',
    education: '',
    pmdcId: ''
  })
  const [errors, setErrors] = useState({})
  
  const { signup, loading, error, setError, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    }
    
    // Doctor-specific validation
    if (formData.role === 'doctor') {
      if (!formData.specialization) {
        newErrors.specialization = 'Specialization is required for doctors'
      }
      if (!formData.experience) {
        newErrors.experience = 'Experience is required for doctors'
      }
      if (!formData.education) {
        newErrors.education = 'Education is required for doctors'
      }
      if (!formData.pmdcId) {
        newErrors.pmdcId = 'PMDC ID is required for doctors'
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    const submitData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      password: formData.password
    }

    // Add doctor-specific fields if role is doctor
    if (formData.role === 'doctor') {
      submitData.specialization = formData.specialization
      submitData.experience = formData.experience
      submitData.education = formData.education
      submitData.pmdcId = formData.pmdcId
    }

    const result = await signup(submitData)
    if (result.success) {
      if (result.requiresApproval) {
        navigate('/login', {
          state: {
            message: 'Registration submitted! Please wait for admin approval before logging in.'
          }
        })
      } else {
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Glass morphism card */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/50">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-200">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                sign in to existing account
              </Link>
            </p>
          </div>
        
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <ErrorMessage 
            message={error} 
            onClose={() => setError('')}
          />
          
          <Input
            label="Full Name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Enter your full name"
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email"
          />
          
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="Enter your phone number"
          />
          
          {/* Role Selection with Dark Theme Support */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
              required
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          
          {/* Doctor-specific fields */}
          {formData.role === 'doctor' && (
            <>
              <Input
                label="Specialization"
                name="specialization"
                type="text"
                required
                value={formData.specialization}
                onChange={handleChange}
                error={errors.specialization}
                placeholder="e.g., Cardiologist, Neurologist"
              />
              
              <Input
                label="Experience (years)"
                name="experience"
                type="number"
                required
                value={formData.experience}
                onChange={handleChange}
                error={errors.experience}
                placeholder="Years of experience"
              />
              
              <Input
                label="Education"
                name="education"
                type="text"
                required
                value={formData.education}
                onChange={handleChange}
                error={errors.education}
                placeholder="e.g., MBBS, MD"
              />
              
              <Input
                label="PMDC ID"
                name="pmdcId"
                type="text"
                required
                value={formData.pmdcId}
                onChange={handleChange}
                error={errors.pmdcId}
                placeholder="Enter your PMDC registration ID"
              />
            </>
          )}
          
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter strong password"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 -mt-1">
            Password must contain: 8+ characters, uppercase, lowercase, number, and special character (@$!%*?&#)
          </p>
          
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Sign Up
          </Button>
          
          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Login
            </Link>
          </p>
        </form>
        </div>
      </div>
    </div>
  )
}

export default Signup
