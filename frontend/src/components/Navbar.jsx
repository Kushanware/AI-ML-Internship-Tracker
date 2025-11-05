import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar(){
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="brand">
        <Link to="/">AI/ML Internship Tracker</Link>
      </div>
      <nav className="nav-links">
        <Link to="/">Home</Link>
        {user && <Link to="/dashboard">Dashboard</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/signup">Sign up</Link>}
        {user && (
          <button type="button" onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        )}
      </nav>
    </header>
  )
}
