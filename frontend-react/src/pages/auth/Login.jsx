import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import ErrorMessage from '../../components/common/ErrorMessage'
import ThemeToggle from '../../components/common/ThemeToggle'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  
  const { login, loading, error, setError, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Role-based dashboard redirect function
  const redirectToDashboard = (userRole) => {
    const role = userRole.toLowerCase()
    console.log('Redirecting user with role:', role)
    
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true })
        break
      case 'doctor':
        navigate('/doctor/dashboard', { replace: true })
        break
      case 'patient':
        navigate('/patient/dashboard', { replace: true })
        break
      default:
        console.log('Unknown role, redirecting to patient dashboard')
        navigate('/patient/dashboard', { replace: true })
    }
  }

  useEffect(() => {
    if (user) {
      console.log('User already logged in:', user)
      redirectToDashboard(user.role)
    }
    
    // Show success message from signup
    if (location.state?.message) {
      console.log('Signup success message:', location.state.message)
    }
  }, [user, navigate, location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    if (error) {
      setError('')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('Login form submitted:', { email: formData.email })
    
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    try {
      const result = await login(formData.email, formData.password)
      console.log('Login result:', result)
      
      if (result.success && result.role) {
        console.log('Login successful, user role:', result.role)
        // Small delay to ensure state update
        setTimeout(() => {
          redirectToDashboard(result.role)
        }, 100)
      } else {
        console.log('Login failed:', result.message)
        setError(result.message || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <ThemeToggle />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Glass morphism card */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/50">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                create a new account
              </Link>
            </p>
          </div>

        {/* Show signup success message */}
        {location.state?.message && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{location.state.message}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <ErrorMessage 
              message={error} 
              onClose={() => setError('')}
            />
            
            <Input
              label="Email address"
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
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Admin credentials help */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Admin Login: admin@hospital.com / admin123456
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

export default Login
