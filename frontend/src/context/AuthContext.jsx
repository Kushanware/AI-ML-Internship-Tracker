import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('aiml-token');
      const storedUser = localStorage.getItem('aiml-user');

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);

        axios
          .get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          })
          .then(() => {
            setToken(storedToken);
            setUser(userData);
          })
          .catch(() => {
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

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
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

  const register = async (name, email, password) => {
    setError(null);
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password });
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

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('aiml-token');
    localStorage.removeItem('aiml-user');
  };

  const value = { user, token, loading, error, isAuthenticated: !!token, login, register, logout };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
