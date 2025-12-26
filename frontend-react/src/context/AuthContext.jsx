import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('✅ User session restored:', parsedUser);
        } catch (err) {
          console.error('❌ Error parsing stored user:', err);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return { 
          success: true, 
          message: data.message || 'Account created successfully!',
          requiresApproval: data.requiresApproval || false
        };
      }
      
      throw new Error(data.message || 'Signup failed');
    } catch (error) {
      console.error('Signup error:', error);
      const message = error.message === 'Failed to fetch' 
        ? 'Cannot connect to server. Please ensure the backend is running.'
        : error.message;
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const userData = {
          id: data.user.id || data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role.toLowerCase()
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        
        return { 
          success: true, 
          role: userData.role,
          message: 'Login successful'
        };
      }
      
      throw new Error(data.message || 'Invalid credentials');
    } catch (error) {
      console.error('❌ Login error:', error);
      const message = error.message === 'Failed to fetch'
        ? 'Cannot connect to server. Please ensure the backend is running on http://localhost:5000'
        : error.message;
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUserData = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      setError, 
      login, 
      signup, 
      logout,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
