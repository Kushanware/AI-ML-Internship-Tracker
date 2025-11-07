import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg">AI/ML Internship Tracker</Link>
        <nav className="flex gap-4 items-center">
          <Link to="/" className="text-gray-700 hover:text-gray-900">Browse</Link>
          {token && <>
            <Link to="/saved" className="text-gray-700 hover:text-gray-900">Saved</Link>
            <Link to="/settings" className="text-gray-700 hover:text-gray-900">Settings</Link>
          </>}
          {token ? (
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
            >Logout ({user?.name})</button>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded bg-blue-600 text-white">Login</Link>
              <Link to="/signup" className="px-3 py-1.5 rounded border">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
