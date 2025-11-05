import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import InternshipList from './components/InternshipList'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import DashboardPage from './components/DashboardPage'
import Navbar from './components/Navbar'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }){
  const { user } = useAuth()
  if(!user){
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App(){
  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<InternshipList />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <small>&copy; {new Date().getFullYear()} Internship Tracker</small>
      </footer>
    </div>
  )
}
