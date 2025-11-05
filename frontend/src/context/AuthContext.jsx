import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Custom hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Authentication provider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from storage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('aiml-token');
      const storedUser = localStorage.getItem('aiml-user');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Verify token is still valid
        axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        }).then(() => {
          setToken(storedToken);
          setUser(userData);
        }).catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('aiml-token');
          localStorage.removeItem('aiml-user');
        });
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Configure axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  /**
   * Log in a user
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('aiml-token', data.token);
      localStorage.setItem('aiml-user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  /**
   * Register a new user
   */
  const register = async (name, email, password) => {
    try {
      setError(null);
      const { data } = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('aiml-token', data.token);
      localStorage.setItem('aiml-user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  /**
   * Log out the current user
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('aiml-token');
    localStorage.removeItem('aiml-user');
  };

  /**
   * Update user preferences
   */
  const updatePreferences = async (preferences) => {
    try {
      setError(null);
      const { data } = await axios.patch(`${API_URL}/users/preferences`, preferences);
      
      const updatedUser = { ...user, preferences: data.preferences };
      setUser(updatedUser);
      localStorage.setItem('aiml-user', JSON.stringify(updatedUser));
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updatePreferences
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}
