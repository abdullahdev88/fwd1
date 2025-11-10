import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Use /auth/me instead of /users/me
      const response = await api.get('/auth/me')
      if (response.data.success) {
        setUser(response.data.user)
      }
    } catch (error) {
      localStorage.removeItem('token')
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError('')
      setLoading(true)
      
      // Test connection first
      try {
        await api.get('/health')
        console.log('✅ Backend connection successful')
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError)
        throw new Error('Cannot connect to server. Please make sure the backend is running.')
      }
      
      const response = await api.post('/auth/login', { email, password })
      
      if (response.data.success) {
        const { token, user } = response.data
        localStorage.setItem('token', token)
        setUser(user)
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      let message = 'Login failed'
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if the backend is running on port 5000.'
      } else if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.message) {
        message = error.message
      }
      
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (name, email, password) => {
    try {
      setError('')
      setLoading(true)
      
      // Test connection first
      try {
        await api.get('/health')
        console.log('✅ Backend connection successful')
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError)
        throw new Error('Cannot connect to server. Please make sure the backend is running.')
      }
      
      // Use /auth/signup (the main route) instead of /auth/register
      const response = await api.post('/auth/signup', { name, email, password })
      
      if (response.data.success) {
        const { token, user } = response.data
        localStorage.setItem('token', token)
        setUser(user)
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      let message = 'Signup failed'
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if the backend is running on port 5000.'
      } else if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.message) {
        message = error.message
      }
      
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
