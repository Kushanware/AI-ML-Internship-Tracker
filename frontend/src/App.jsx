import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import SavedPage from './pages/SavedPage'
import SettingsPage from './pages/SettingsPage'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/ToastProvider'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/saved" element={<PrivateRoute><SavedPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="*" element={<div className="p-8">Not found. <Link className="text-blue-600" to="/">Go home</Link></div>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Layout />
      </ToastProvider>
    </AuthProvider>
  )
}
